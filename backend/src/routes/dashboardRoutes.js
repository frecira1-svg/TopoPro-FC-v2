const express = require('express');

const router = express.Router();

const {
  obtenerResumen
} = require('../controllers/dashboardController');

const {
  protegerRuta
} = require('../middleware/authMiddleware');

router.get('/resumen', protegerRuta, obtenerResumen);

module.exports = router;