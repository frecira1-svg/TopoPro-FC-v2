const multer = require('multer');

const uploadCSV = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB máximo
  },
  fileFilter: (req, file, cb) => {

    const esCSV =
      file.mimetype === 'text/csv' ||
      file.originalname.toLowerCase().endsWith('.csv');

    if (!esCSV) {
      return cb(new Error('Solo se permiten archivos CSV'));
    }

    cb(null, true);

  }
});

const {
  crearPunto,
  obtenerPuntos,
  obtenerPuntosPorProyecto,
  obtenerPuntoPorId,
  actualizarPunto,
  eliminarPunto,
  obtenerPuntosCercanos,
  importarPuntosCSV
} = require('../services/puntoTopografico.service');


// ===============================
// CREAR PUNTO
// ===============================

async function crear(req, res) {

  try {

    const punto = await crearPunto(
      req.body,
      req.usuario
    );

    return res.status(201).json(punto);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// OBTENER TODOS
// ===============================

async function listar(req, res) {

  try {

    const puntos = await obtenerPuntos(
      req.usuario
    );

    return res.json(puntos);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// OBTENER POR PROYECTO
// ===============================

async function listarPorProyecto(req, res) {

  try {

    const { proyectoId } = req.params;

    const puntos = await obtenerPuntosPorProyecto(
      Number(proyectoId),
      req.usuario
    );

    return res.json(puntos);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// OBTENER POR ID
// ===============================

async function obtener(req, res) {

  try {

    const punto = await obtenerPuntoPorId(
      req.params.id,
      req.usuario
    );

    return res.json(punto);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// ACTUALIZAR
// ===============================

async function actualizar(req, res) {

  try {

    const punto = await actualizarPunto(
      req.params.id,
      req.body,
      req.usuario
    );

    return res.json(punto);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// ELIMINAR
// ===============================

async function eliminar(req, res) {

  try {

    const resultado = await eliminarPunto(
      req.params.id,
      req.usuario
    );

    return res.json(resultado);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// PUNTOS CERCANOS
// ===============================

async function listarCercanos(req, res) {

  try {

    const { lat, lng, radioKm } = req.query;

    if (!lat || !lng || !radioKm) {
      return res.status(400).json({
        error: 'lat, lng y radioKm son obligatorios'
      });
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radioNum = Number(radioKm);

    if (
      !Number.isFinite(latNum) ||
      !Number.isFinite(lngNum) ||
      !Number.isFinite(radioNum) ||
      radioNum <= 0
    ) {
      return res.status(400).json({
        error: 'lat, lng y radioKm deben ser valores numéricos válidos'
      });
    }

    const puntos = await obtenerPuntosCercanos(
      latNum,
      lngNum,
      radioNum,
      req.usuario
    );

    return res.json(puntos);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// IMPORTAR CSV
// ===============================

async function importarCSV(req, res) {

  try {

    const { proyectoId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        error: 'Debes subir un archivo CSV'
      });
    }

    let contenidoCSV = req.file.buffer.toString('utf-8');

    // Eliminar BOM de archivos UTF-8
    if (contenidoCSV.charCodeAt(0) === 0xFEFF) {
      contenidoCSV = contenidoCSV.slice(1);
    }

    const resultado = await importarPuntosCSV(
      Number(proyectoId),
      contenidoCSV,
      req.usuario
    );

    return res.status(201).json(resultado);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


module.exports = {
  crear,
  listar,
  listarPorProyecto,
  obtener,
  actualizar,
  eliminar,
  listarCercanos,
  importarCSV,
  uploadCSV
};