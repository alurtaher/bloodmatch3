const express = require('express')
const router = express.Router();
const {autocomplete,forwardGeocode,reverseGeocode,matchUser,matchAllUsers,getAllMatchesPage} = require('../controllers/geocodeController')
// Autocomplete Endpoint
const {protect} = require('../middleware/auth')
router.get('/autocomplete',autocomplete);

// Forward Geocoding Endpoint
router.get('/forward-geocode', forwardGeocode);

// Reverse Geocoding Endpoint
router.get('/reverse-geocode',reverseGeocode);

// Match Users Endpoint
router.post('/match',protect, matchUser);

router.get('/match/all',getAllMatchesPage)

router.get('/match/all/data',protect,matchAllUsers);

module.exports = router;