const mongoose = require("mongoose");
const CONNECTION_STRING = process.env.CONNECTION_STRING;
mongoose
  .connect(CONNECTION_STRING)
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("probleme de connection a la db", err));
