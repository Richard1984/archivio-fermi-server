const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const _ = require("lodash");
const validator = require('validator');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./public/pics");
  },
  filename: function(req, file, cb) {
    cb(null, String(req.user._id) + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {

  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif") {
    cb(null, true);
  } else {
    cb(null, false);
  }

};

const limits = {
  fileSize: 1024 * 1024 * 2 // 2 MB
}

const upload = multer({
  storage,
  limits,
  fileFilter
});


// Middleware
const {
  authenticate,
  authenticateAdmin,
  authenticateUser
} = require("./../middleware/authenticate");

// Models
const {
  User
} = require("./../models/user");


router.post("/updateInformations", authenticate, (req, res) => {

  var body = _.pick(req.body, ["old", "new"]);

  User.findByCredentials(req.user.email, body.old)
    .then((user) => {

      if (validator.isEmpty(body.new) || body.new.length < 6) {
        return res.status(400).send("Password non valida o troppo breve. (min. 6).");
      } else if (body.old === body.new) {
        return res.status(400).send("La password attuale è uguale a quella nuova.");
      }

      user.password = body.new;
      user.tokens = [];
      return user.save();
    })
    .then((user) => {
      res.status(200).send();
    })
    .catch((e) => {
      res.status(400).send(e);
    });

});


router.post("/updateProfilePic", authenticate, upload.single("picToUpload"), (req, res) => {
  let file = req.file;

  if (!file) {
    return res.status(400).send("Nessun file caricato.");
  }

  User.findById(req.user._id)
    .then((user) => {
      user.img = file.filename;
      return user.save();
    })
    .then(() => {
      res.status(200).send("Immagine di profilo cambiata con successo.");
    })
    .catch((e) => {
      return Promise.reject(e);
    });

});

router.post("/disableAccount", authenticate, (req, res) => {
  User.findById(req.user._id)
    .then((user) => {
      user.state = "disabled";
      user.tokens = [];
      return user.save()
    })
    .then(() => {
      res.status(200).send();
    })
    .catch((e) => {
      res.status(400).send(e);
    });

});


module.exports = router;