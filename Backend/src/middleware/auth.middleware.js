const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const tokenBlacklistModel = require('../config/models/blacklist.model');

async function authUser(req, res, next) {
  try {
    let token = req.cookies?.token;
    if (!token) {
      const authHeader = req.headers?.authorization || '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication token not provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklisted = await tokenBlacklistModel.exists({ tokenHash });
    if (blacklisted) {
      return res.status(401).json({ message: 'Token has been revoked (blacklisted)' });
    }

    req.user = { id: decoded.id, username: decoded.username };
    return next();
  } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authUser };
