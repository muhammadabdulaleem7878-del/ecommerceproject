
const { verifyAccessToken } = require('../services/tokenService');

const requireRole = (...allowedRoles) => (req, res, next) => {
  const authHeader = req.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.get('token');

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required.',
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (!payload || !payload.sub || !payload.role) {
      return res.status(401).json({
        message: 'Invalid token.',
      });
    }

    if (!allowedRoles.includes(payload.role)) {
      return res.status(403).json({
        message: 'Access denied.',
      });
    }

    req.auth = payload;
    req.user = payload;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }
};

module.exports = { requireRole };
