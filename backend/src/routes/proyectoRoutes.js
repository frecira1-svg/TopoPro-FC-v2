const express = require('express');
const router = express.Router();

const {
  protegerRuta
} = require('../middleware/authMiddleware');

const {
  verificarPermiso
} = require('../middleware/permisoMiddleware');

const {
  obtenerProyectos,
  obtenerProyecto,
  crearProyecto,
  actualizarProyecto,
  eliminarProyecto,
  proyectosCercanosController
} = require('../controllers/proyectoController');


// =====================================================
// AUTENTICACIÓN
// =====================================================

router.use(protegerRuta);


// =====================================================
// CONSULTAR PROYECTOS
// =====================================================

router.get(
  '/cercanos',
  verificarPermiso('proyectosVer'),
  proyectosCercanosController
);

router.get(
  '/',
  verificarPermiso('proyectosVer'),
  obtenerProyectos
);

router.get(
  '/:id',
  verificarPermiso('proyectosVer'),
  obtenerProyecto
);


// =====================================================
// CREAR
// =====================================================

router.post(
  '/',
  verificarPermiso('proyectosCrear'),
  crearProyecto
);


// =====================================================
// EDITAR
// =====================================================

router.put(
  '/:id',
  verificarPermiso('proyectosEditar'),
  actualizarProyecto
);


// =====================================================
// ELIMINAR
// =====================================================

router.delete(
  '/:id',
  verificarPermiso('proyectosEliminar'),
  eliminarProyecto
);


module.exports = router;