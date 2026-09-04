const {
  registrarUsuario,
  loginUsuario,
  solicitarRecuperacion,
  restablecerPassword,
  verificarEmail,
  reenviarVerificacion,
  obtenerPerfil,
  actualizarPerfil,
  cambiarRol,
  actualizarFoto,
  cambiarPassword
} = require('../services/authService');


// ===============================
// REGISTRO
// ===============================

async function registro(req, res) {

  try {

    const {
      nombre,
      apellido,
      correo,
      password,
      telefono,
      profesion,
      empresa,
      ciudad,
      pais
    } = req.body;


    if (!nombre || !apellido || !correo || !password) {

      return res.status(400).json({
        error:
          'Nombre, apellido, correo y contraseña son obligatorios'
      });

    }


    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regexCorreo.test(correo)) {

      return res.status(400).json({
        error:
          'El correo no tiene un formato válido'
      });

    }


    if (password.length < 8) {

      return res.status(400).json({
        error:
          'La contraseña debe tener al menos 8 caracteres'
      });

    }


    const resultado =
      await registrarUsuario({

        nombre,
        apellido,
        correo,
        password,
        telefono,
        profesion,
        empresa,
        ciudad,
        pais

      });


    return res.status(201).json(resultado);


  } catch (err) {

    console.error(
      '\n================ ERROR REGISTRO ================'
    );

    console.error(err);

    console.error(
      '===============================================\n'
    );


    return res.status(err.status || 500).json({

      error: err.message

    });

  }

}


// ===============================
// LOGIN
// ===============================

async function login(req, res) {

  try {

    const {
      correo,
      password
    } = req.body;


    if (!correo || !password) {

      return res.status(400).json({

        error:
          'Correo y contraseña son obligatorios'

      });

    }


    const resultado =
      await loginUsuario({

        correo,
        password

      });


    return res.json(resultado);


  } catch (err) {

    console.error(err);


    return res.status(err.status || 500).json({

      error: err.message

    });

  }

}


// ===============================
// RECUPERAR PASSWORD
// ===============================

async function recuperarPassword(req, res) {

  try {

    const resultado =
      await solicitarRecuperacion(req.body);


    return res.json(resultado);


  } catch (err) {

    console.error(err);


    return res.status(err.status || 500).json({

      error: err.message

    });

  }

}


// ===============================
// RESTABLECER PASSWORD
// ===============================

async function restablecerPasswordController(req, res) {

  try {

    const resultado =
      await restablecerPassword(req.body);


    return res.json(resultado);


  } catch (err) {

    console.error(err);


    return res.status(err.status || 500).json({

      error: err.message

    });

  }

}


// ===============================
// REENVIAR VERIFICACIÓN DE EMAIL
// ===============================

async function reenviarVerificacionController(req, res) {

  try {

    const { correo } = req.body;


    if (!correo) {

      return res.status(400).json({
        error: 'El correo es obligatorio'
      });

    }


    const resultado =
      await reenviarVerificacion(correo);


    return res.status(200).json(resultado);


  } catch (error) {

    console.error(
      'ERROR REENVIANDO VERIFICACIÓN:',
      error
    );


    return res.status(error.status || 500).json({

      error: error.message ||
        'Error al reenviar el correo de verificación'

    });

  }

}


// ===============================
// VERIFICAR EMAIL
// ===============================

async function verificarEmailController(req, res) {

  try {

    const { token } = req.query;


    if (!token) {

      return res.redirect(
        `${process.env.APP_URL}/correo-verificado?estado=error&mensaje=Token+requerido`
      );

    }


    await verificarEmail(token);


    return res.redirect(
      `${process.env.APP_URL}/correo-verificado?estado=exito`
    );


  } catch (err) {

    console.error(
      'ERROR VERIFICANDO EMAIL:',
      err
    );


    return res.redirect(
      `${process.env.APP_URL}/correo-verificado?estado=error&mensaje=${encodeURIComponent(err.message)}`
    );

  }

}


// ===============================
// PERFIL
// ===============================

async function perfil(req, res) {

  try {

    const usuario =
      await obtenerPerfil(req.usuario.id);


    res.status(200).json({

      usuario

    });


  } catch (err) {

    res.status(err.status || 500).json({

      error:
        err.message ||
        'Error al obtener perfil'

    });

  }

}


// ===============================
// ACTUALIZAR PERFIL
// ===============================

async function actualizarPerfilController(req, res) {

  try {

    const usuario =
      await actualizarPerfil(
        req.usuario.id,
        req.body
      );


    res.status(200).json({

      usuario

    });


  } catch (err) {

    res.status(err.status || 500).json({

      error:
        err.message ||
        'Error al actualizar perfil'

    });

  }

}


// ===============================
// CAMBIAR CONTRASEÑA
// ===============================

async function cambiarPasswordController(req, res) {

  try {

    const {
      passwordActual,
      passwordNueva
    } = req.body;


    const resultado =
      await cambiarPassword(
        req.usuario.id,
        passwordActual,
        passwordNueva
      );


    res.status(200).json(resultado);


  } catch (err) {

    res.status(err.status || 500).json({

      error:
        err.message ||
        'Error al cambiar la contraseña'

    });

  }

}


// ===============================
// CAMBIAR ROL
// ===============================

async function cambiarRolController(req, res) {

  try {

    const {
      usuarioId,
      nuevoRol
    } = req.body;


    if (!usuarioId || !nuevoRol) {

      return res.status(400).json({

        error:
          'usuarioId y nuevoRol son obligatorios'

      });

    }


    const usuario =
      await cambiarRol(
        Number(usuarioId),
        nuevoRol
      );


    res.status(200).json({

      usuario

    });


  } catch (err) {

    res.status(err.status || 500).json({

      error:
        err.message ||
        'Error al cambiar rol'

    });

  }

}


// ===============================
// SUBIR FOTO DE PERFIL
// ===============================

async function subirFotoPerfil(req, res) {

  try {

    if (!req.file) {

      return res.status(400).json({
        error: 'No se recibió ninguna imagen'
      });

    }


    const usuario =
      await actualizarFoto(
        req.usuario.id,
        req.file.path
      );


    res.status(200).json({
      usuario
    });


  } catch (err) {

    res.status(err.status || 500).json({

      error:
        err.message ||
        'Error al subir la foto de perfil'

    });

  }

}


// ===============================
// EXPORTACIONES
// ===============================

module.exports = {

  registro,

  login,

  recuperarPassword,

  restablecerPasswordController,

  verificarEmailController,

  reenviarVerificacionController,

  perfil,

  actualizarPerfilController,

  cambiarRolController,

  subirFotoPerfil,

  cambiarPasswordController

};
