const express = require('express');
const router = express.Router();

const {
  crear,
  listar,
  listarPorProyecto,
  obtener,
  actualizar,
  eliminar,
  listarCercanos,
  importarCSV,
  uploadCSV
} = require('../controllers/puntoTopografico.controller');

const {
  protegerRuta
} = require('../middleware/authMiddleware');

const {
  verificarPermiso
} = require('../middleware/permisoMiddleware');


// ===============================
// PUNTOS TOPOGRÁFICOS
// ===============================

// Todas las rutas requieren autenticación
router.use(protegerRuta);


// ===============================
// CONSULTAR
// ===============================

// Listar todos los puntos
router.get(
  '/',
  verificarPermiso('proyectosVer'),
  listar
);

// Puntos cercanos — utilizados por Mapas
router.get(
  '/cercanos',
  verificarPermiso('proyectosVer'),
  listarCercanos
);

// Listar puntos de un proyecto
router.get(
  '/proyecto/:proyectoId',
  verificarPermiso('proyectosVer'),
  listarPorProyecto
);

// Obtener un punto por ID
router.get(
  '/:id',
  verificarPermiso('proyectosVer'),
  obtener
);


// ===============================
// CREAR
// ===============================

// Crear punto
router.post(
  '/',
  verificarPermiso('proyectosCrear'),
  crear
);

// Importar puntos desde CSV
router.post(
  '/importar/:proyectoId',
  verificarPermiso('proyectosCrear'),
  uploadCSV.single('archivo'),
  importarCSV
);


// ===============================
// EDITAR
// ===============================

// Actualizar punto
router.put(
  '/:id',
  verificarPermiso('proyectosEditar'),
  actualizar
);


// ===============================
// ELIMINAR
// ===============================

// Eliminar punto
router.delete(
  '/:id',
  verificarPermiso('proyectosEliminar'),
  eliminar
);


module.exports = router;