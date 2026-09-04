const express = require('express');
const router = express.Router();
const { listar } = require('../controllers/directorio.controller');

// Directorio público: solo expone información profesional y trabajos publicados.
router.get('/', listar);

module.exports = router;
