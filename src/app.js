const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const swaggerSpec = require('./docs/swagger');
const { globalLimiter } = require('./middleware/rateLimiters');
const { requireJson } = require('./middleware/contentType');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const memeRoutes = require('./routes/memes');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    frameguard: { action: 'deny' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      const error = new Error('Origin не входит в CORS white list');
      error.status = 403;
      return callback(error);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: env.jsonBodyLimit }));
app.use(cookieParser());
app.use(globalLimiter);
app.use(requireJson);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'meme-exchange-api' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/categories', categoryRoutes);
app.use('/memes', memeRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
