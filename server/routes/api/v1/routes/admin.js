const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const {
  sanitizeParam
} = require('express-validator/filter')

const {
  check,
  body
} = require('express-validator/check')

const {
  ObjectId
} = mongoose.Types

const {
  postUser,
  patchUser,
  sendEmail,
  getRequests,
  acceptRequest,
  refuseRequest,
  toggleState,
  resetPassword
} = require('../../../../controllers/admin')
// Middleware
const {
  authenticate,
  authenticateAdmin
} = require('../../../../middlewares/authenticate')

const checkErrors = require('../../../../middlewares/check')

const {
  asyncMiddleware
} = require('../../../../middlewares/async')

const {
  User
} = require('../../../../models/user')

router.post('/users/',
  authenticate,
  authenticateAdmin,
  body('email').custom((value) => User.findByEmail(value)
    .then(user => {
      if (user) {
        return Promise.reject(new Error('L\'email inserita è già in uso.'))
      }
    })),
  body('firstname')
    .not().isEmpty().withMessage('Il nome è obbligatorio.')
    .trim()
    .escape(),
  check('lastname')
    .not().isEmpty().withMessage('Il cognome è obbligatorio.')
    .trim()
    .escape(),
  checkErrors,
  asyncMiddleware(postUser))

router.patch('/users/:id',
  authenticate,
  authenticateAdmin,
  body('email')
    .isEmail()
    .normalizeEmail(),
  sanitizeParam('id')
    .customSanitizer(value => {
      return ObjectId(value)
    }),
  checkErrors,
  asyncMiddleware(patchUser))

router.patch('/users/:id/state/',
  authenticate,
  authenticateAdmin,
  body('id').custom((value) => User.findById(value)
    .then(user => {
      if (!user) {
        return Promise.reject(new Error('L\'utente non esiste.'))
      }
    })),
  sanitizeParam('id')
    .customSanitizer(value => {
      return ObjectId(value)
    }),
  checkErrors,
  asyncMiddleware(toggleState))

router.patch('/users/:id/password',
  authenticate,
  authenticateAdmin,
  body('id').custom((value) => User.findById(value)
    .then(user => {
      if (!user) {
        return Promise.reject(new Error('L\'utente non esiste.'))
      }
    })),
  sanitizeParam('id')
    .customSanitizer(value => {
      return ObjectId(value)
    }),
  checkErrors,
  asyncMiddleware(resetPassword))

router.post('/mails/', authenticate, authenticateAdmin, asyncMiddleware(sendEmail))
router.get('/requests/', authenticate, authenticateAdmin, asyncMiddleware(getRequests))

router.patch('/requests/:id',
  authenticate,
  authenticateAdmin,
  sanitizeParam('id')
    .customSanitizer(value => {
      return ObjectId(value)
    }),
  asyncMiddleware(acceptRequest))

router.delete('/requests/:id',
  authenticate,
  authenticateAdmin,
  sanitizeParam('id')
    .customSanitizer(value => {
      return ObjectId(value)
    }),
  asyncMiddleware(refuseRequest))

module.exports = router
