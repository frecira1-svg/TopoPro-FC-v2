const express = require('express');
const router = express.Router();

const {
  protegerRuta
} = require('../middleware/authMiddleware');

const {
  verificarPermiso
} = require('../middleware/permisoMiddleware');

const {
  obtenerEquipos,
  obtenerEquipo,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo
} = require('../controllers/equipoController');


// =====================================================
// AUTENTICACIÓN
// =====================================================

router.use(protegerRuta);


// =====================================================
// CONSULTAR
// =====================================================

router.get(
  '/',
  verificarPermiso('equiposVer'),
  obtenerEquipos
);

router.get(
  '/:id',
  verificarPermiso('equiposVer'),
  obtenerEquipo
);


// =====================================================
// CREAR
// =====================================================

router.post(
  '/',
  verificarPermiso('equiposCrear'),
  crearEquipo
);


// =====================================================
// EDITAR
// =====================================================

router.put(
  '/:id',
  verificarPermiso('equiposEditar'),
  actualizarEquipo
);


// =====================================================
// ELIMINAR
// =====================================================

router.delete(
  '/:id',
  verificarPermiso('equiposEliminar'),
  eliminarEquipo
);


module.exports = router;