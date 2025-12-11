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
    const existingUser = await User.findOne({ email });
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

    const savedUser = await newUser.save();

    res.json({
      result: true,
      user: {
        id: savedUser._id,
        email: savedUser.email,
        username: savedUser.username,
        token: savedUser.token,
        addresses: savedUser.addresses,
      },
    });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ result: false, error: "Missing fields" });
    }

    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res.json({ result: false, error: "User not found" });
    }

    // Comparer mot de passe
    const isPasswordCorrect = bcrypt.compareSync(password, foundUser.password);
    console.log("Password correct ?", isPasswordCorrect);

    if (!isPasswordCorrect) {
      return res.json({ result: false, error: "Incorrect password" });
    }

    // Après avoir retrouver le user, générer un nouveau token pour raison de sécurité
    const newToken = uid2(32);
    const implementNewToken = await User.findOneAndUpdate(
      { token: foundUser.token },
      { token: newToken },
      { new: true }
    );

    // Tout est OK, on renvoie les infos user
    if (!implementNewToken) {
      return res.json({
        result: true,
        user: {
          id: foundUser._id,
          email: foundUser.email,
          username: foundUser.username,
          token: foundUser.token,
          addresses: foundUser.addresses,
        },
      });
    }
    const { token, username, addresses } = implementNewToken;
    res.json({
      result: true,
      user: {
        id: implementNewToken._id,
        email: implementNewToken.email,
        token,
        username,
        addresses,
      },
    });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

// route POST pour login automatique
router.post("/auto-signin/:token", async (req, res) => {
  const tokenFromParams = req.params.token;

  try {
    const response = await User.findOne({ token: tokenFromParams });
    if (!response) {
      return res
        .status(404)
        .json({ result: false, error: "Token not matching any user" });
    }

    // Après avoir retrouver le user, générer un nouveau token pour raison de sécurité
    const newToken = uid2(32);
    const implementNewToken = await User.findOneAndUpdate(
      { token: tokenFromParams },
      { token: newToken },
      { new: true }
    );

    // Tout est OK, on renvoie les infos user

    if (!implementNewToken) {
      return res.json({
        result: true,
        user: {
          id: response._id,
          email: response.email,
          username: response.username,
          token: response.token,
          addresses: response.addresses,
        },
      });
    }
    const { email, token, username, addresses } = implementNewToken;
    res.json({
      result: true,
      user: { id: implementNewToken._id, email, token, username, addresses },
    });

    // res.status(200).json({
    //   result: true,
    //   user: { email, username, token, addresses },
    // });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      error: `Le catch de la requête renvoie une erreur ${error}`,
    });
  }
});

// route POST pour modifier un champ de User (addresses et username)
router.post("/update/", async (req, res) => {
  try {
    // Extrait filter pour la recherche mongoose findOne && updateField qui peut être soit addresses ou username
    const updateField = req.query;
    const filter = req.body.email;

    const coordinates = req.body.coordinates;

    // Vérifie pour updateField === addresses et commence le processus d'ajout d'une nouvelle addresse

    if (Object.hasOwn(updateField, "addresses")) {
      const fetchUser = await User.findOne({ email: filter });
      console.log(filter, "filtre");

      const fetchedAddresses = fetchUser.addresses;

      // Vérifie si l'addresse existe déjà avec son nom
      if (
        fetchedAddresses.some(
          (addresse) => addresse.address === updateField.addresses
        )
      ) {
        return res.json({ result: false, error: "Address already exists" });
      }

      // Update le tableau d'addresses retournées par fetchAddresses pour ajouter une addresse
      const insert = [
        ...fetchedAddresses,
        { address: updateField.addresses, coords: coordinates },
      ];

      // Retrouve le User, update son tableau d'addresses et renvoit le tout
      const data = await User.findOneAndUpdate(
        { email: filter },
        { addresses: insert },
        { new: true }
      );
      res.json({ result: true, addresses: data.addresses });

      // Vérifie pour updateField === username et commence le processus de modification du username
    } else {
      const data = await User.findOneAndUpdate({ email: filter }, updateField, {
        new: true,
      });
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

// route DELETE pour supprimer une adresse d'un user
router.delete("/update/", async (req, res) => {
  try {
    // Extrait le filter pour chercher un user et l'addresse à supprimer depuis les query params
    const filter = req.body;
    const addresseToDelete = Object.values(req.query)[0];

    // Récupère le User et ses addresses
    const fetchUser = await User.findOne(filter);
    const fetchedAddresses = fetchUser.addresses;

    // Vérifie si l'addresse à supprimer existe
    if (
      !fetchedAddresses.some(
        (addresse) => addresse.address === addresseToDelete
      )
    ) {
      return res.json({ result: false, error: "Address doesn't exists" });
    }

    // Récupère l'addresse dans le tableau d'addresses pour pouvoir la filtrer par la suite et renvoyer un tableau sans elle
    const findAddress = fetchedAddresses.find(
      (addresse) => addresse.address === addresseToDelete
    );
    const insert = fetchedAddresses.filter(
      (addresse) => addresse !== findAddress
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

// route DELETE de suppression de compte - CETTE ACTION EST DEFINITIVE
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
