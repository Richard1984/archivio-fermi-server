const express = require('express')
const router = express.Router()

const {
  getDocumentVisibility
} = require('../../../../controllers/document_visibility')

// Middleware
const {
  asyncMiddleware
} = require('../../../../middlewares/async')

router.get('/', asyncMiddleware(getDocumentVisibility))

module.exports = router
