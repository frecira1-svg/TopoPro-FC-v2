const express = require('express');
const router = express.Router();

const {
  protegerRuta
} = require('../middleware/authMiddleware');

const {
  verificarPermiso
} = require('../middleware/permisoMiddleware');

const {
  obtenerLevantamientos,
  obtenerLevantamiento,
  crearLevantamiento,
  actualizarLevantamiento,
  eliminarLevantamiento
} = require('../controllers/levantamientoController');


// =====================================================
// AUTENTICACIÓN
// =====================================================

router.use(protegerRuta);


// =====================================================
// CONSULTAR
// =====================================================

router.get(
  '/',
  verificarPermiso('levantamientosVer'),
  obtenerLevantamientos
);

router.get(
  '/:id',
  verificarPermiso('levantamientosVer'),
  obtenerLevantamiento
);


// =====================================================
// CREAR
// =====================================================

router.post(
  '/',
  verificarPermiso('levantamientosCrear'),
  crearLevantamiento
);


// =====================================================
// EDITAR
// =====================================================

router.put(
  '/:id',
  verificarPermiso('levantamientosEditar'),
  actualizarLevantamiento
);


// =====================================================
// ELIMINAR
// =====================================================

router.delete(
  '/:id',
  verificarPermiso('levantamientosEliminar'),
  eliminarLevantamiento
);


module.exports = router;