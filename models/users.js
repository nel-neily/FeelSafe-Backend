const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  email: String,
  password: String,
  username: String,
  token: String,
  addresses: [String],
});

const User = mongoose.model("users", userSchema);
module.exports = User;
