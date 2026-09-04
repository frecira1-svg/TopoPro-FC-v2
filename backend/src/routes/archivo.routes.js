const express = require('express');
const router = express.Router();

const {
  subir,
  listarPorProyecto,
  listarPorPunto,
  eliminar
} = require('../controllers/archivo.controller');

const { protegerRuta } = require('../middleware/authMiddleware');
const { uploadArchivo } = require('../config/cloudinary');


// Subir un archivo (con proyectoId o puntoId en el body)
router.post(
  '/',
  protegerRuta,
  uploadArchivo.single('archivo'),
  subir
);

// Listar archivos de un proyecto
router.get(
  '/proyecto/:proyectoId',
  protegerRuta,
  listarPorProyecto
);

// Listar archivos de un punto
router.get(
  '/punto/:puntoId',
  protegerRuta,
  listarPorPunto
);

// Eliminar archivo
router.delete(
  '/:id',
  protegerRuta,
  eliminar
);


module.exports = router;