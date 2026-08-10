const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/users
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ name: 1 });
  res.json(users);
});

module.exports = { listUsers };
