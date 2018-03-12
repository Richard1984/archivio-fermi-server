const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

var UserSchema = new mongoose.Schema({
  firstname: { // OK
    type: String,
    required: true,
    minlength: 1,
    unique: false,
    validate: {
      validator: validator.isAlpha,
      message: "{VALUE} non è un nome valido."
    }
  },
  lastname: { // OK
    type: String,
    required: true,
    minlength: 1,
    unique: false,
    validate: {
      validator: validator.isAlpha,
      message: "{VALUE} non è un cognome valido."
    }
  },
  email: { // CONTROLLARE
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: "{VALUE} non è un indirizzo email valido."
    }
  },
  password: { // CONTROLLARE
    type: String,
    required: true,
    minlength: 6
  },
  img: { // OK
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    default: "../static/elements/profile.jpg"
  },
  // accesses: [{
  //   _id: {
  //     type: String,
  //     required: false,
  //     trim: true,
  //     minlength: 1,
  //     validate: {
  //       validator: validator.isAlpha,
  //       message: "{VALUE} non è un accesso valido."
  //     },
  //     ref: "Subject"
  //   }
  // }],
  accesses: [{ // OK
    type: String,
    required: false,
    trim: true,
    minlength: 1,
    validate: {
      validator: validator.isAlpha,
      message: "{VALUE} non è un accesso valido."
    },
    ref: "Subject"
  }],
  privileges: { // CONTROLLARE
    type: String,
    required: false,
    trim: true,
    minlength: 1,
    unique: false,
    default: "user",
    // validate: {
    //   validator: validator.isAlpha,
    //   message: "{VALUE} non è un privilegio valido."
    // },
    ref: "Privilege"
  },
  state: { // OK
    type: String,
    reuired: true,
    trim: true,
    minlength: 1,
    unique: false,
    default: "pending",
    validate: {
      validator: validator.isAlpha,
      message: "{VALUE} non è un stato valido."
    }
  },
  tokens: [{ // OK
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

UserSchema.methods.toJSON = function() {
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ["_id", "firstname", "lastname", "email", "state", "privileges", "img"]);
}

UserSchema.methods.generateAuthToken = function() {
  var user = this;
  var access = "auth";
  var token = jwt.sign({
    _id: user._id.toHexString(),
    access
  }, process.env.JWT_SECRET).toString();

  user.tokens.push({
    access,
    token
  });

  return user.save()
    .then(() => {
      return token;
    });
}

UserSchema.methods.removeToken = function(token) {
  var user = this;

  return user.update({
    $pull: {
      tokens: {
        token
      }
    }
  });

}

UserSchema.statics.findByToken = function(token) {
  var User = this;
  // var decoded;

  return jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
    if (err) {
      return Promise.reject(err);
    } else {
      return User.findOne({
        _id: decoded._id,
        "tokens.token": token,
        "tokens.access": "auth"
      });
    }
  });

}

UserSchema.statics.findByCredentials = function(email, password) {
  var User = this;

  return User.findOne({
      email
    })
    .then((user) => {

      if (!user) {
        return Promise.reject("Nessun utente registrato con l'email inserita.");
      }

      if (user.state !== "active") {
        return Promise.reject("Il tuo account è stato disabilitato.");
      }

      return bcrypt.compare(password, user.password)
        .then((result) => {
          if (result) {
            return Promise.resolve(user);
          } else {
            return Promise.reject("Password errata");
          }
        });

    });
}

UserSchema.statics.getUsers = function() {
  var User = this;

  return User.find()
    .select(["firstname", "lastname"])
    .then((results) => {
      return Promise.resolve(results);
    })
    .catch((e) => {
      return Promise.reject(e);
    });

}

UserSchema.pre("save", function(next) {
  var user = this;

  if (user.isModified("password")) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }

});

UserSchema.index({
  firstname: "text",
  lastname: "text"
});

var User = mongoose.model("User", UserSchema);

module.exports = {
  User
};