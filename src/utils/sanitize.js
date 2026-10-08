const sanitizeHtml = require('sanitize-html');

function stripHtml(value) {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

function sanitizeObject(payload, keys) {
  const result = { ...payload };
  keys.forEach((key) => {
    if (typeof result[key] === 'string') {
      result[key] = stripHtml(result[key]);
    }
  });
  return result;
}

function pick(payload, allowedKeys) {
  const result = {};
  allowedKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key) && payload[key] !== undefined) {
      result[key] = payload[key];
    }
  });
  return result;
}

module.exports = { stripHtml, sanitizeObject, pick };
