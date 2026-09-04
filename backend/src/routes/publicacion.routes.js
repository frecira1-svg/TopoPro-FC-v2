const express = require('express');
const router = express.Router();

const {
  crear,
  listar,
  obtener,
  actualizar,
  eliminar,
  comentar,
  eliminarComentarioController
} = require('../controllers/publicacion.controller');

const { protegerRuta } = require('../middleware/authMiddleware');
const { uploadPublicacion, uploadPublicaciones } = require('../config/cloudinary');

// Contenido público: cualquier visitante puede descubrir la comunidad.
router.get('/', listar);
router.get('/:id', obtener);

// Acciones que requieren una cuenta autenticada.
router.post('/', protegerRuta, uploadPublicaciones.array('imagenes', 10), crear);
router.put('/:id', protegerRuta, uploadPublicaciones.array('imagenes', 10), actualizar);
router.delete('/:id', protegerRuta, eliminar);
router.post('/:id/comentarios', protegerRuta, comentar);
router.delete('/comentarios/:comentarioId', protegerRuta, eliminarComentarioController);

module.exports = router;
