const express = require('express');

const router = express.Router();

const {
  protegerRuta
} = require('../middleware/authMiddleware');

const {
  obtenerComercial
} = require('../controllers/comercialController');


// ==========================================
// AUTENTICACIÓN
// ==========================================

router.use(protegerRuta);


// ==========================================
// CONSULTAR PLAN Y SUSCRIPCIÓN
// ==========================================

router.get(
  '/',
  obtenerComercial
);


module.exports = router;