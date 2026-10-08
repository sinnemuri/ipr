function requireJson(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const hasBody = Number(req.headers['content-length'] || 0) > 0;
    if (!hasBody) return next();
    const type = req.headers['content-type'] || '';
    if (!type.toLowerCase().includes('application/json')) {
      return res.status(415).json({
        error: 'Требуется Content-Type: application/json',
      });
    }
  }
  return next();
}

module.exports = { requireJson };
