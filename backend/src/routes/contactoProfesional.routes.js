const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middleware/authMiddleware');
const controller = require('../controllers/contactoProfesional.controller');

router.post('/:usuarioId', protegerRuta, controller.crear);
router.get('/recibidos', protegerRuta, controller.recibidos);
router.get('/pendientes', protegerRuta, controller.pendientes);
router.patch('/:id/estado', protegerRuta, controller.estado);
module.exports = router;
