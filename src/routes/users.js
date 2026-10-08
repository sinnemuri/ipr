const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const { perUserLimiter } = require('../middleware/rateLimiters');
const { updateUserSchema, updateRoleSchema, idParamSchema } = require('../validators/schemas');

const router = express.Router();

router.use(authenticate, perUserLimiter);

router.get('/', roleGuard('admin'), userController.list);
router.get('/:id', validate(idParamSchema, 'params'), userController.getById);
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateUserSchema),
  userController.update
);
router.patch(
  '/:id/role',
  roleGuard('admin'),
  validate(idParamSchema, 'params'),
  validate(updateRoleSchema),
  userController.updateRole
);
router.delete(
  '/:id',
  roleGuard('admin'),
  validate(idParamSchema, 'params'),
  userController.remove
);

module.exports = router;
