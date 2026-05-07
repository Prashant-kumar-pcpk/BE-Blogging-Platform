const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { apiRateLimiter } = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');
const securityHeaders = require('./middleware/securityHeaders');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorMiddleware');
const corsOptions = require('./config/corsOptions');

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const commentsRoutes = require('./routes/comments');

const app = express();

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(securityHeaders);
app.use(apiRateLimiter);
app.use(requestLogger);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
