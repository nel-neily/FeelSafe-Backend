const mongoose = require("mongoose");

const addressesSchema = mongoose.Schema({
  address: String,
  coords: Array,
});

const userSchema = mongoose.Schema({
  email: String,
  password: String,
  username: String,
  token: String,
  addresses: [addressesSchema],
});

const User = mongoose.model("users", userSchema);
module.exports = User;
