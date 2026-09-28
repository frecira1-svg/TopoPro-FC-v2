const express = require('express');

const router = express.Router();

const {
  protegerRuta
} = require('../middleware/authMiddleware');

const {
  obtenerComercial,
  crearSuscripcion,
  confirmarSuscripcion
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


// ==========================================
// CREAR SUSCRIPCIÓN
// ==========================================

router.post(
  '/suscripciones',
  crearSuscripcion
);


// ==========================================
// CONFIRMAR SUSCRIPCIÓN MERCADO PAGO
// ==========================================

router.post(
  '/suscripciones/confirmar',
  confirmarSuscripcion
);


module.exports = router;