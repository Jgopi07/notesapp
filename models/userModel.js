const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the user schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare the password provided during login with the hashed password in the database
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Create and export the User model
const User = mongoose.model('User', userSchema);
module.exports = User;
