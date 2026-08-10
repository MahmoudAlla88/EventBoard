const express = require('express');
const { topVenues } = require('../controllers/statsController');

const router = express.Router();

router.get('/top-venues', topVenues);

module.exports = router;
