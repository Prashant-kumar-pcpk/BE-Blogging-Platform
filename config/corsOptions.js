const configuredOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.NETLIFY_URL
]
  .filter(Boolean)
  .flatMap((origins) => origins.split(','))
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultDevOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002'
];

const defaultProductionOrigins = [
  'https://prashantdairies-blogging-platform.netlify.app'
];

const allowedOrigins = [
  ...new Set([
    ...configuredOrigins,
    ...defaultDevOrigins,
    ...defaultProductionOrigins
  ])
];

const corsOptions = {
  origin(origin, callback) {
    const isLocalhostOrigin = typeof origin === 'string'
      && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    const isAllowedConfiguredOrigin = typeof origin === 'string' && allowedOrigins.includes(origin);

    if (!origin || isAllowedConfiguredOrigin || isLocalhostOrigin) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = corsOptions;
