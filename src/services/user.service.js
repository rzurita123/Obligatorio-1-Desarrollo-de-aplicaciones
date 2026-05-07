const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

async function findUserByUsername(username) {
  return User.findOne({ username: username.trim() });
}

async function createUser({ name, username, email, password }) {
  const hashed = await bcrypt.hash(password, 10);
  const doc = new User({
    name: name.trim(),
    username: username.trim(),
    email: email && String(email).trim() ? String(email).trim() : undefined,
    password: hashed,
    active: true,
  });
  await doc.save();
  return doc;
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = {
  findUserByUsername,
  createUser,
  comparePassword,
};
