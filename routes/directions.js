var express = require("express");
var router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
    const { start, end } = req.body;

    if (!start || !end) {
      return res.json({ result: false, error: "Missing coordinates" });
    }

    const response = await axios.post(
      "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
      {
        coordinates: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude],
        ],
      },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const geometry = response.data.features[0].geometry.coordinates;

    // Convertit [lng, lat] → { latitude, longitude }
    const route = geometry.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    res.json({ result: true, route });
  } catch (error) {
    console.error("ORS error:", error.message);
    res.json({ result: false, error: "Itinerary error" });
  }
});

module.exports = router;