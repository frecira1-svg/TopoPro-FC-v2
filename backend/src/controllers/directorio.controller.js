const { listarProfesionales } = require('../services/directorio.service');

async function listar(req, res, next) {
  try {
    const profesionales = await listarProfesionales({
      busqueda: req.query.busqueda,
      ciudad: req.query.ciudad,
      especialidad: req.query.especialidad
    });
    res.json(profesionales);
  } catch (error) {
    next(error);
  }
}

module.exports = { listar };
