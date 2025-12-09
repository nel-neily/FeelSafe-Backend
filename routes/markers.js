var express = require("express");
var router = express.Router();

const Marker = require("../models/markers");

router.post("/addmarkers", (req, res) => {
  try {
    const { latitude, longitude, color, riskType, userId } = req.body;

    //  vérif des champs obligatoires
    if (!latitude || !longitude || !riskType || !userId) {
      return res.json({ result: false, error: "Missing fields" });
    }

    //  création du marker
    const newMarker = new Marker({
      latitude,
      longitude,
      color,
      riskType,
      user: userId, // clé étrangère versl'utilisateur
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

router.get("/", (req, res) => {
  Marker.find()
    .then((markers) => {
      res.json({ result: true, markers });
    })
    .catch((err) => {
      res.json({ result: false, error: err.message });
    });
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
      if (marker.user.toString() !== userId) {
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

module.exports = router;
