const { obtenerPerfilPublico } = require('../services/perfilPublico.service');

async function obtener(req, res) {
  try {
    const perfil = await obtenerPerfilPublico(req.params.id);
    return res.json(perfil);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({
      error: err.message || 'Error al obtener el perfil público'
    });
  }
}

module.exports = { obtener };
