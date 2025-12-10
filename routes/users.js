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

// route POST pour modifier un champ de User (addresses et username)
router.post("/update/", async (req, res) => {
  try {
    const filter = req.body;
    const update = req.query;

    if (Object.hasOwn(update, "addresses")) {
      const fetchUser = await User.findOne(filter);
      const fetchedAddresses = fetchUser.addresses;
      if (fetchedAddresses.some((addresse) => addresse === update.addresses)) {
        return res.json({ result: false, error: "Address already exists" });
      }
      const insert = [...fetchedAddresses, update.addresses];
      const data = await User.findOneAndUpdate(
        filter,
        { addresses: insert },
        { new: true }
      );
      const { addresses } = data;
      res.json({ result: true, addresses });
    } else {
      const data = await User.findOneAndUpdate(filter, update, { new: true });
      const { username } = data;
      res.json({ result: true, username });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      error: `Le catch de la requête renvoie une erreur ${error}`,
    });
  }
});

// route POST pour login automatique
router.post("/auto-signin/:token", async (req, res) => {
  const tokenFromParams = req.params.token;

  try {
    const response = await User.findOne({ token: tokenFromParams });
    if (!response) {
      res
        .status(404)
        .json({ result: false, error: "Token not matching any user" });
    }
    const { email, username, token, addresses } = response;
    res.status(200).json({
      result: true,
      user: { email, username, token, addresses },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      error: `Le catch de la requête renvoie une erreur ${error}`,
    });
  }
});

// route DELETE pour supprimer une adresse d'un user
router.delete("/update/", async (req, res) => {
  try {
    const filter = req.body;
    const addresseToDelete = Object.values(req.query)[0];

    const fetchUser = await User.findOne(filter);
    const fetchedAddresses = fetchUser.addresses;
    if (!fetchedAddresses.some((addresse) => addresse === addresseToDelete)) {
      return res.json({ result: false, error: "Address doesn't exists" });
    }
    const insert = fetchedAddresses.filter(
      (addresse) => addresse !== addresseToDelete
    );
    const data = await User.findOneAndUpdate(
      filter,
      { addresses: insert },
      { new: true }
    );
    const { addresses } = data;
    res.json({ result: true, addresses });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      error: `Le catch de la requête renvoie une erreur ${error}`,
    });
  }
});

router.delete("/:token", async (req, res) => {
  try {
    const token = req.params.token;

    const response = await User.deleteOne({ token });
    if (response.deletedCount === 0) {
      return res.status(404).json({ result: false, error: "User not found" });
    }
    res.json({ result: true, response });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      error: `Le catch de la requête renvoie une erreur ${error}`,
    });
  }
});

module.exports = router;
