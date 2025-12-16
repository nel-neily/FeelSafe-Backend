var express = require("express");
var router = express.Router();
const { getPolygon, excludeMarker } = require("../utils/function");
const Marker = require("../models/markers");

router.post("/", async (req, res) => {
  try {
    const { start, end } = req.body;

    if (!start || !end) {
      return res.json({ result: false, error: "Missing coordinates" });
    }
    const userPolygon = getPolygon(start.latitude, start.longitude);
    const allMarkers = await Marker.find();
    // Transforme chaque polygone en Feature GeoJSON

    const features = allMarkers
      .filter(
        (marker) =>
          marker.polygon &&
          excludeMarker(
            userPolygon,
            marker.polygon.coordinates[0][3],
            marker.polygon.coordinates[0][1]
          )
      )
      .map((marker) => (marker.polygon ? marker.polygon.coordinates : null));

    const body = {
      coordinates: [
        [start.longitude, start.latitude],
        [end.longitude, end.latitude],
      ],
      options: {
        avoid_polygons: {
          type: "MultiPolygon",
          coordinates: features,
        },
      },
    };

    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
      {
        method: "POST",
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    const geometry = data.features[0].geometry.coordinates;

    // Convertit [lng, lat] → { latitude, longitude }
    const route = geometry.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    res.json({ result: true, route });
  } catch (error) {
    console.error("ORS error:", error.message, error);
    res.json({ result: false, error: "Itinerary error" });
  }
});

module.exports = router;
