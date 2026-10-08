const Joi = require('joi');

const emailSchema = Joi.string().email({ tlds: { allow: false } }).max(255);

const passwordSchema = Joi.string()
  .min(8)
  .max(72)
  .pattern(/[0-9]/)
  .pattern(/[^A-Za-z0-9]/)
  .messages({
    'string.min': 'Пароль должен содержать минимум 8 символов',
    'string.pattern.base': 'Пароль должен содержать цифру и спецсимвол',
  });

const registerSchema = Joi.object({
  email: emailSchema.required(),
  username: Joi.string().alphanum().min(3).max(50).required(),
  password: passwordSchema.required(),
});

const loginSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: emailSchema.required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().hex().length(64).required(),
  password: passwordSchema.required(),
});

const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50),
  email: emailSchema,
}).min(1);

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'moderator', 'admin').required(),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  categoryId: Joi.number().integer().positive(),
  q: Joi.string().max(80),
  sort: Joi.string().valid('new', 'top').default('new'),
});

const categorySchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).min(2).max(80).required(),
  description: Joi.string().max(300).allow('', null),
});

const categoryUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(80),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).min(2).max(80),
  description: Joi.string().max(300).allow('', null),
}).min(1);

const memeCreateSchema = Joi.object({
  title: Joi.string().min(2).max(120).required(),
  imageUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(500).required(),
  description: Joi.string().max(500).allow('', null),
  categoryId: Joi.number().integer().positive().required(),
});

const memeUpdateSchema = Joi.object({
  title: Joi.string().min(2).max(120),
  imageUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(500),
  description: Joi.string().max(500).allow('', null),
  categoryId: Joi.number().integer().positive(),
  status: Joi.string().valid('published', 'hidden'),
}).min(1);

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserSchema,
  updateRoleSchema,
  idParamSchema,
  paginationSchema,
  categorySchema,
  categoryUpdateSchema,
  memeCreateSchema,
  memeUpdateSchema,
};
