const express = require('express');
const router = express.Router();

const {
  protegerRuta
} = require('../middleware/authMiddleware');

const {
  verificarPermiso
} = require('../middleware/permisoMiddleware');

const {
  obtenerReporteProyecto,
  obtenerReporteProyectoPDF,
  obtenerReporteProyectoExcel
} = require('../controllers/reporteController');


// =====================================================
// REPORTE TÉCNICO JSON
// =====================================================

router.get(
  '/proyecto/:id',
  protegerRuta,
  verificarPermiso('reportesVer'),
  obtenerReporteProyecto
);


// =====================================================
// MEMORIA DE CÁLCULO PDF
// =====================================================

router.get(
  '/memoria-calculo/:id/pdf',
  protegerRuta,
  verificarPermiso('reportesVer'),
  obtenerReporteProyectoPDF
);


// =====================================================
// MEMORIA DE CÁLCULO EXCEL
// =====================================================

router.get(
  '/memoria-calculo/:id/excel',
  protegerRuta,
  verificarPermiso('reportesVer'),
  obtenerReporteProyectoExcel
);


module.exports = router;