const express = require('express');
const router = express.Router();
const { obtener } = require('../controllers/perfilPublico.controller');

// Perfil profesional público: no requiere autenticación.
router.get('/:id', obtener);

module.exports = router;
