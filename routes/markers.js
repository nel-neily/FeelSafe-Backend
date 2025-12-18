var express = require("express");
var router = express.Router();
const { getPolygon } = require("../utils/function");

const Marker = require("../models/markers");
const User = require("../models/users");

function getExpirationDelay(color) {
  if (color === "#E57373") return 1 * 60 * 60 * 1000; // expire en 1h
  if (color === "#FFB74D") return 4 * 60 * 60 * 1000; // expire en 4h
  if (color === "#FFEB3B") return 24 * 60 * 60 * 1000; // expire en 24h
  if (color === "#A66CFF") return 8 * 60 * 60 * 1000; //  expire en 8h
  return Infinity; //  empêche de supprimer les couleurs inconnues
}

router.post("/addmarkers", (req, res) => {
  try {
    const { latitude, longitude, color, riskType, userId } = req.body;
    console.log("POST /addmarkers OK", req.body);
    //  vérif des champs obligatoires
    if (!latitude || !longitude || !riskType) {
      return res.json({ result: false, error: "Missing fields" });
    }

    //  création du marker
    const newMarker = new Marker({
      latitude,
      longitude,
      color,
      riskType,
      users: userId ? userId : null, // clé étrangère versl'utilisateur
      createdAt: new Date(),
      upvotes: 1,
      polygon: {
        type: "Polygon",
        coordinates: getPolygon(latitude, longitude),
      },
    });

    //  Sauvegarde en BDD
    newMarker
      .save()
      .then((savedMarker) => {
        res.json({
          result: true,
          marker: savedMarker,
        });
      })
      .catch((error) => {
        console.log("error savedMarker", error);
        res.json({ result: false, error: "Database error" });
      });
  } catch (err) {
    res.json({ result: false, error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  res.set("Cache-Control", "no-store"); // Désactive la mise en cache
  try {
    const markers = await Marker.find();

    const now = Date.now();
    const validMarkers = [];
    const expiredMarkers = [];

    // Vérifie chaque marker
    for (let m of markers) {
      const delay = getExpirationDelay(m.color);
      const age = now - new Date(m.createdAt).getTime();
      // Encore valide ?
      if (age < delay) {
        validMarkers.push(m);
      } else {
        expiredMarkers.push(m._id);
      }
    }
    // Supprimer les markers expirés
    if (expiredMarkers.length > 0) {
      await Marker.deleteMany({ _id: { $in: expiredMarkers } });
    }
    // Retourner seulement les markers encore valides
    return res.json({ result: true, markers: validMarkers });
  } catch (err) {
    console.error("GET markers error:", err);
    res.json({ result: false, error: "Server error" });
  }
});

router.delete("/:id", (req, res) => {
  const markerId = req.params.id;
  const userId = req.body.userId; // <-- l'utilisateur qui demande la suppression

  Marker.findById(markerId)
    .then((marker) => {
      if (!marker) {
        return res.json({ result: false, error: "Marker not found" });
      }

      // Vérification propriétaire
      if (marker.users.toString() !== userId) {
        return res.json({ result: false, error: "Unauthorized" });
      }

      // SI OK => supprime
      Marker.findByIdAndDelete(markerId).then(() => {
        res.json({ result: true, message: "Marker deleted" });
      });
    })
    .catch((err) => {
      res.json({ result: false, error: err.message });
    });
});

router.post("/update-upvote/:token", async (req, res) => {
  try {
    const _id = req.body._id;
    const token = req.params.token;
    const user = await User.findOne({ token });
    const m = await Marker.findOne({ _id });
    if (!user.upvotes || !user.upvotes.some((markerId) => markerId === _id)) {
      const marker = await Marker.findOneAndUpdate(
        { _id },
        { upvotes: m.upvotes + 1 },
        { new: true }
      );
      user.upvotes.push(_id);
      await User.findOneAndUpdate(
        { token },
        { upvotes: user.upvotes },
        { new: true }
      );

      res.json({ result: true, marker });
    } else {
      const marker = await Marker.findOneAndUpdate(
        { _id },
        { upvotes: m.upvotes - 1 },
        { new: true }
      );
      const newFilter = user.upvotes.filter((id) => id !== _id);
      await User.findOneAndUpdate({ token }, { upvotes: newFilter });
      res.json({ result: true, marker });
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
