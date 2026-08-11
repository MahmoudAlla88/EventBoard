const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function toPublicUser(user) {
  return { _id: user._id, name: user.name, email: user.email };
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'password must be at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  res.status(201).json({ token, user: toPublicUser(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  // Password has `select: false` on the schema, so it's opted back in here.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    // Deliberately the same message for "no such user" and "wrong password"
    // — don't reveal which one it was.
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user._id);

  res.json({ token, user: toPublicUser(user) });
});

// GET /api/auth/me — lets the frontend restore a session from a stored
// token on page load without asking the user to log in again.
const me = asyncHandler(async (req, res) => {
  res.json(toPublicUser(req.user));
});

module.exports = { register, login, me };
