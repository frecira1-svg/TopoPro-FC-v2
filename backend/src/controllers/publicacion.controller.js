const {
  crearPublicacion,
  obtenerPublicaciones,
  obtenerPublicacionPorId,
  actualizarPublicacion,
  eliminarPublicacion,
  crearComentario,
  eliminarComentario
} = require('../services/publicacion.service');


// ===============================
// CREAR PUBLICACIÓN
// ===============================

async function crear(req, res) {

  try {

    const { titulo, contenido, tipo, tipoTrabajo, ubicacion, etiquetas } = req.body;
    const imagen = req.files?.[0]?.path || req.file?.path || req.body.imagen || null;
    const imagenes = req.files || (req.file ? [req.file] : []);

    if (!titulo || !contenido) {
      return res.status(400).json({
        error: 'titulo y contenido son obligatorios'
      });
    }

    const publicacion = await crearPublicacion({
      titulo,
      contenido,
      tipo,
      imagen,
      tipoTrabajo,
      ubicacion,
      etiquetas,
      usuarioId: req.usuario.id,
      rolUsuario: req.usuario.rol,
      imagenes
    });

    return res.status(201).json(publicacion);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// LISTAR PUBLICACIONES
// ===============================

async function listar(req, res) {

  try {

    const { tipo } = req.query;

    const publicaciones = await obtenerPublicaciones(tipo);

    return res.json(publicaciones);

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

    const publicacion = await obtenerPublicacionPorId(req.params.id);

    return res.json(publicacion);

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

    const publicacion = await actualizarPublicacion(
      req.params.id,
      { ...req.body, imagen: req.files?.[0]?.path || req.file?.path || req.body.imagen || null, imagenes: req.files || (req.file ? [req.file] : []) },
      req.usuario.id,
      req.usuario.rol
    );

    return res.json(publicacion);

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

    const resultado = await eliminarPublicacion(
      req.params.id,
      req.usuario.id,
      req.usuario.rol
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
// CREAR COMENTARIO
// ===============================

async function comentar(req, res) {

  try {

    const { contenido } = req.body;
    const { id } = req.params;

    if (!contenido) {
      return res.status(400).json({
        error: 'El contenido del comentario es obligatorio'
      });
    }

    const comentario = await crearComentario({
      contenido,
      usuarioId: req.usuario.id,
      publicacionId: id
    });

    return res.status(201).json(comentario);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// ===============================
// ELIMINAR COMENTARIO
// ===============================

async function eliminarComentarioController(req, res) {

  try {

    const resultado = await eliminarComentario(
      req.params.comentarioId,
      req.usuario.id,
      req.usuario.rol
    );

    return res.json(resultado);

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
  obtener,
  actualizar,
  eliminar,
  comentar,
  eliminarComentarioController
};