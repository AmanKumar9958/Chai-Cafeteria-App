/**
 * DEPRECATED: This middleware has been superseded by JWT-based admin authentication.
 * File kept temporarily for compatibility; not used anywhere.
 * Please use `middleware/adminJwt.js` and remove this file when convenient.
 */
module.exports = function (_req, res, _next) {
  return res.status(410).json({ message: 'Deprecated adminAuth middleware. Use JWT-based admin auth.' });
};
