const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

const defaultDevOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002'
];

const allowedOrigins = [...new Set([...configuredOrigins, ...defaultDevOrigins])];

const corsOptions = {
  origin(origin, callback) {
    const isLocalhostOrigin = typeof origin === 'string'
      && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    if (!origin || allowedOrigins.includes(origin) || isLocalhostOrigin) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
};

module.exports = corsOptions;
