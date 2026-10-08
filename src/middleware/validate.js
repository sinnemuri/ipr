const { stripHtml } = require('../utils/sanitize');

function walkSanitize(value) {
  if (typeof value === 'string') return stripHtml(value);
  if (Array.isArray(value)) return value.map(walkSanitize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, walkSanitize(nested)])
    );
  }
  return value;
}

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: error.details.map((item) => item.message),
      });
    }

    req[property] = walkSanitize(value);
    return next();
  };
}

module.exports = { validate };
