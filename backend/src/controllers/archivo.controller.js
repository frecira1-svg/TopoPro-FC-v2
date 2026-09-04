const {
  crearArchivo,
  obtenerArchivosPorProyecto,
  obtenerArchivosPorPunto,
  eliminarArchivo
} = require('../services/archivo.service');


// ===============================
// SUBIR ARCHIVO
// ===============================

async function subir(req, res) {

  try {

    if (!req.file) {
      return res.status(400).json({
        error: 'No se recibió ningún archivo'
      });
    }

    const { proyectoId, puntoId } = req.body;

    const esImagen = req.file.mimetype.startsWith('image/');

    const archivo = await crearArchivo({
      nombre: req.file.originalname,
      url: req.file.path,
      tipo: esImagen ? 'imagen' : 'documento',
      proyectoId,
      puntoId
    }, req.usuario);

    return res.status(201).json(archivo);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// LISTAR POR PROYECTO
// ===============================

async function listarPorProyecto(req, res) {

  try {

    const { proyectoId } = req.params;

    const archivos = await obtenerArchivosPorProyecto(proyectoId, req.usuario);

    return res.json(archivos);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// LISTAR POR PUNTO
// ===============================

async function listarPorPunto(req, res) {

  try {

    const { puntoId } = req.params;

    const archivos = await obtenerArchivosPorPunto(puntoId, req.usuario);

    return res.json(archivos);

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

    const { id } = req.params;

    const resultado = await eliminarArchivo(id, req.usuario);

    return res.json(resultado);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


module.exports = {
  subir,
  listarPorProyecto,
  listarPorPunto,
  eliminar
};