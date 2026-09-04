const {
  obtenerUsuarios,
  obtenerPermisos,
  actualizarPermisos
} = require('../services/permiso.service');


// =====================================================
// LISTAR USUARIOS
// =====================================================

async function listarUsuarios(req, res) {

  try {

    const usuarios = await obtenerUsuarios();

    return res.json(usuarios);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// =====================================================
// OBTENER PERMISOS DE UN USUARIO
// ADMIN
// =====================================================

async function obtener(req, res) {

  try {

    const { usuarioId } = req.params;

    const permisos = await obtenerPermisos(usuarioId);

    return res.json(permisos);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// =====================================================
// OBTENER MIS PROPIOS PERMISOS
// USUARIO / ADMIN
// =====================================================

async function obtenerMisPermisos(req, res) {

  try {

    const usuarioId = Number(req.usuario.id);

    const permisos = await obtenerPermisos(usuarioId);

    return res.json(permisos);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


// =====================================================
// ACTUALIZAR PERMISOS
// ADMIN
// =====================================================

async function actualizar(req, res) {

  try {

    const { usuarioId } = req.params;

    const permisos = await actualizarPermisos(
      usuarioId,
      req.body,
      req.usuario
    );

    return res.json(permisos);

  } catch (err) {

    console.error(err);

    return res.status(err.status || 500).json({
      error: err.message
    });

  }

}


module.exports = {
  listarUsuarios,
  obtener,
  obtenerMisPermisos,
  actualizar
};