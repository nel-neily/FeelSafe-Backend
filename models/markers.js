const mongoose = require("mongoose");

const polygonSchema = new mongoose.Schema({
  type: {
    type: String,
    default: "Polygon",
    required: true,
  },
  coordinates: {
    type: [[[Number]]], // tableaux imbriqués pour les anneaux du polygone
    required: true,
  },
});

const markerSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  color: String,
  riskType: String,
  upvotes: Number,
  users: { type: mongoose.Schema.Types.ObjectId, ref: "users" } | null, // référence à l'utilisateur
  createdAt: { type: Date, default: Date.now() }, // date de création,
  polygon: polygonSchema,
});

const Marker = mongoose.model("markers", markerSchema);

module.exports = Marker;
