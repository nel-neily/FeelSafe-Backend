const mongoose = require("mongoose");

const markerSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  color: String,
  riskType: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, // référence à l'utilisateur
  createdAt: { type: Date, default: Date.now() }, // date de création
});

const Marker = mongoose.model("markers", markerSchema);

module.exports = Marker;
