const {
  obtenerContextoComercial
} = require('../services/comercial.service');


// ==========================================
// OBTENER CONTEXTO COMERCIAL DEL USUARIO
// ==========================================

async function obtenerComercial(req, res) {

  try {

    const contexto =
      await obtenerContextoComercial(
        Number(req.usuario.id)
      );

    return res.json(contexto);

  } catch (error) {

    console.error(
      'ERROR CONTEXTO COMERCIAL:',
      error
    );

    return res.status(
      error.estadoHttp ||
      error.status ||
      500
    ).json({
      error:
        error.message ||
        'No se pudo obtener la información comercial'
    });

  }

}


module.exports = {
  obtenerComercial
};