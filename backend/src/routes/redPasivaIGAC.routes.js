const express = require('express');
const router = express.Router();

const {
  listar,
  listarDepartamentos,
  listarMunicipios,
  listarCercanos,
} = require('../controllers/redPasivaIGAC.controller');

const { protegerRuta } = require('../middleware/authMiddleware');
const { verificarPermiso } = require('../middleware/permisoMiddleware');

router.use(protegerRuta);

router.get(
  '/departamentos',
  verificarPermiso('proyectosVer'),
  listarDepartamentos
);

router.get(
  '/municipios',
  verificarPermiso('proyectosVer'),
  listarMunicipios
);

router.get(
  '/cercanos',
  verificarPermiso('proyectosVer'),
  listarCercanos
);

router.get(
  '/',
  verificarPermiso('proyectosVer'),
  listar
);

module.exports = router;
