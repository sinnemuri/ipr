const express = require('express');
const memeController = require('../controllers/memeController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const { perUserLimiter } = require('../middleware/rateLimiters');
const {
  memeCreateSchema,
  memeUpdateSchema,
  idParamSchema,
  paginationSchema,
} = require('../validators/schemas');

const router = express.Router();

router.get('/', validate(paginationSchema, 'query'), memeController.list);
router.get('/stats', memeController.getStats);
router.get(
  '/:id',
  optionalAuth,
  validate(idParamSchema, 'params'),
  memeController.getById
);
router.post(
  '/',
  authenticate,
  perUserLimiter,
  validate(memeCreateSchema),
  memeController.create
);
router.put(
  '/:id',
  authenticate,
  perUserLimiter,
  validate(idParamSchema, 'params'),
  validate(memeUpdateSchema),
  memeController.update
);
router.patch(
  '/:id',
  authenticate,
  perUserLimiter,
  validate(idParamSchema, 'params'),
  validate(memeUpdateSchema),
  memeController.update
);
router.delete(
  '/:id',
  authenticate,
  perUserLimiter,
  roleGuard('admin'),
  validate(idParamSchema, 'params'),
  memeController.remove
);
router.post(
  '/:id/like',
  authenticate,
  perUserLimiter,
  validate(idParamSchema, 'params'),
  memeController.like
);
router.delete(
  '/:id/like',
  authenticate,
  perUserLimiter,
  validate(idParamSchema, 'params'),
  memeController.unlike
);

module.exports = router;
