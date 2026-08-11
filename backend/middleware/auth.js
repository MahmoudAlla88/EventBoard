const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('./errorHandler');
const asyncHandler = require('./asyncHandler');

// Verifies the `Authorization: Bearer <token>` header and attaches the
// user document to req.user. Any route behind this middleware requires a
// valid, logged-in user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw new ApiError(401, 'Not authenticated — missing token');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Not authenticated — invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'Not authenticated — user no longer exists');

  req.user = user;
  next();
});

module.exports = { protect };
