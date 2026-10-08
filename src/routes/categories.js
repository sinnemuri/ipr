const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const { perUserLimiter } = require('../middleware/rateLimiters');
const { categorySchema, categoryUpdateSchema, idParamSchema } = require('../validators/schemas');

const router = express.Router();

router.get('/', categoryController.list);
router.post(
  '/',
  authenticate,
  perUserLimiter,
  roleGuard('moderator'),
  validate(categorySchema),
  categoryController.create
);
router.patch(
  '/:id',
  authenticate,
  perUserLimiter,
  roleGuard('moderator'),
  validate(idParamSchema, 'params'),
  validate(categoryUpdateSchema),
  categoryController.update
);
router.delete(
  '/:id',
  authenticate,
  perUserLimiter,
  roleGuard('admin'),
  validate(idParamSchema, 'params'),
  categoryController.remove
);

module.exports = router;
