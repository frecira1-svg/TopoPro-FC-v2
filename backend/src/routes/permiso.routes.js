const express = require('express');
const router = express.Router();

const {
  listarUsuarios,
  obtener,
  obtenerMisPermisos,
  actualizar
} = require('../controllers/permiso.controller');

const {
  protegerRuta,
  verificarRol
} = require('../middleware/authMiddleware');


// =====================================================
// MIS PROPIOS PERMISOS
// CUALQUIER USUARIO AUTENTICADO
// =====================================================

router.get(
  '/mios',
  protegerRuta,
  obtenerMisPermisos
);


// =====================================================
// ADMINISTRACIÓN DE PERMISOS
// SOLO ADMIN
// =====================================================

router.get(
  '/usuarios',
  protegerRuta,
  verificarRol('ADMIN'),
  listarUsuarios
);


router.get(
  '/:usuarioId',
  protegerRuta,
  verificarRol('ADMIN'),
  obtener
);


router.put(
  '/:usuarioId',
  protegerRuta,
  verificarRol('ADMIN'),
  actualizar
);


module.exports = router;