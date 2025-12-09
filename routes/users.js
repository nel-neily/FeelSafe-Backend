var express = require("express");
var router = express.Router();
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

const User = require("../models/users");

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérif champs obligatoires
    if (!email || !password) {
      return res.json({ result: false, error: "Missing fields" });
    }
    // Vérifier si user existe déjà
    User.findOne({ email }).then((existingUser) => {
      if (existingUser) {
        return res.json({ result: false, error: "User already exists" });
      }

      // Hash du mot de passe
      const hash = bcrypt.hashSync(password, 10);
      // Création du user
      const newUser = new User({
        email,
        password: hash,
        username: "",
        token: uid2(32),
        addresses: [],
      });

      newUser.save().then((savedUser) => {
        res.json({
          result: true,
          user: {
            email: savedUser.email,
            username: savedUser.username,
            token: savedUser.token,
            addresses: savedUser.addresses,
          },
        });
      });
    });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

router.post("/signin", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ result: false, error: "Missing fields" });
    }

    User.findOne({ email }).then((foundUser) => {
      if (!foundUser) {
        return res.json({ result: false, error: "User not found" });
      }

      // Comparer mot de passe
      const isPasswordCorrect = bcrypt.compareSync(
        password,
        foundUser.password
      );
      console.log("Password correct ?", isPasswordCorrect);

      if (!isPasswordCorrect) {
        return res.json({ result: false, error: "Incorrect password" });
      }

      // Tout est OK, on renvoie les infos user
      res.json({
        result: true,
        user: {
          email: foundUser.email,
          username: foundUser.username,
          token: foundUser.token,
          addresses: foundUser.addresses,
        },
      });
    });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

module.exports = router;
