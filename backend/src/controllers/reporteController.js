const {
  generarReporteProyecto
} = require('../services/reporteService');

const {
  generarReportePDF
} = require('../services/reportePdfService');

const {
  generarReporteExcel
} = require('../services/reporteExcelService');

const {
  verificarPuedeExportar
} = require('../services/comercial.service');


// ==========================================
// REPORTE TÉCNICO JSON
// ==========================================

async function obtenerReporteProyecto(req, res) {

  try {

    const { id } = req.params;

    const reporte = await generarReporteProyecto(
      Number(id),
      req.usuario
    );

    return res.json(reporte);

  } catch (error) {

    console.error('ERROR REPORTE PROYECTO:', error);

    return res.status(
      error.estadoHttp ||
      error.status ||
      500
    ).json({
      error:
        error.message ||
        'Error al generar el reporte'
    });

  }

}


// ==========================================
// REPORTE TÉCNICO PDF
// ==========================================

async function obtenerReporteProyectoPDF(req, res) {

  try {

    const { id } = req.params;

    // ------------------------------------------
    // VALIDAR PLAN COMERCIAL
    // ------------------------------------------

    await verificarPuedeExportar(
      req.usuario.id
    );

    const reporte = await generarReporteProyecto(
      Number(id),
      req.usuario
    );

    res.setHeader(
      'Content-Type',
      'application/pdf'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte-proyecto-${id}.pdf"`
    );

    await generarReportePDF(
      reporte,
      res
    );

  } catch (error) {

    console.error(
      'ERROR REPORTE PDF:',
      error
    );

    if (!res.headersSent) {

      return res.status(
        error.estadoHttp ||
        error.status ||
        500
      ).json({
        error:
          error.message ||
          'Error al generar el PDF'
      });

    }

  }

}


// ==========================================
// REPORTE TÉCNICO EXCEL
// ==========================================

async function obtenerReporteProyectoExcel(req, res) {

  try {

    const { id } = req.params;

    // ------------------------------------------
    // VALIDAR PLAN COMERCIAL
    // ------------------------------------------

    await verificarPuedeExportar(
      req.usuario.id
    );

    const reporte = await generarReporteProyecto(
      Number(id),
      req.usuario
    );

    await generarReporteExcel(
      reporte,
      res
    );

  } catch (error) {

    console.error(
      'ERROR REPORTE EXCEL:',
      error
    );

    if (!res.headersSent) {

      return res.status(
        error.estadoHttp ||
        error.status ||
        500
      ).json({
        error:
          error.message ||
          'Error al generar el Excel'
      });

    }

  }

}


module.exports = {
  obtenerReporteProyecto,
  obtenerReporteProyectoPDF,
  obtenerReporteProyectoExcel
};