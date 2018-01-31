const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const {
  authenticate
} = require("./../middleware/authenticate");


router.get("/*", authenticate, (req, res, next) => {
  next();
});

module.exports = router;