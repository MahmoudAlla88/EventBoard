const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    // select: false so a plain `User.find()` (e.g. GET /api/users for the
    // old "who am I" dropdown, still used to list organizers) never leaks
    // the hash. Auth code explicitly opts in with .select('+password').
    password: {
      type: String,
      required: [true, 'password is required'],
      minlength: [6, 'password must be at least 6 characters'],
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
