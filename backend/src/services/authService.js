const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { jwtSecret } = require('../config/env');

const {
  enviarCorreoVerificacion,
  enviarCorreoRecuperacion
} = require('./emailService');

const { sanitizeUsuario } = require('../utils/sanitizeUsuario');

const BCRYPT_SALT_ROUNDS = 12;


function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      rol: usuario.rol,
      emailVerificado: usuario.emailVerificado
    },
    jwtSecret,
    {
      expiresIn: '7d'
    }
  );
}


// ===============================
// REGISTRO DE USUARIO
// ===============================

async function registrarUsuario({
  nombre,
  apellido,
  correo,
  password,
  telefono,
  profesion,
  empresa,
  ciudad,
  pais
}) {

  const existente = await prisma.usuario.findUnique({
    where: {
      correo
    }
  });


  if (existente) {
    const error = new Error(
      "Ya existe un usuario con ese correo"
    );

    error.status = 409;
    throw error;
  }


  const hash = await bcrypt.hash(
    password,
    BCRYPT_SALT_ROUNDS
  );


  const emailVerificationToken =
    crypto.randomBytes(32).toString('hex');


  const emailVerificationExpires =
    new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );


  const usuario = await prisma.usuario.create({
    data: {

      nombre,
      apellido,
      correo,
      password: hash,

      telefono,
      profesion,
      empresa,
      ciudad,
      pais,

      emailVerificationToken,
      emailVerificationExpires
    }
  });



  await enviarCorreoVerificacion(
    usuario.correo,
    emailVerificationToken,
    usuario.nombre
  );


  const token = generarToken(usuario);


  return {
    usuario: sanitizeUsuario(usuario),
    token
  };
}



// ===============================
// LOGIN
// ===============================

async function loginUsuario({
  correo,
  password
}) {


  const usuario = await prisma.usuario.findUnique({
  where: {
    correo
  }
});

const diagnosticoDB = await prisma.$queryRaw`
  SELECT
    current_database() AS database,
    current_schema() AS schema,
    current_user AS usuario_db,
    inet_server_addr()::text AS servidor_db,
    inet_server_port() AS puerto_db
`;

console.log('========== DIAGNOSTICO BASE DE DATOS ==========');
console.log(diagnosticoDB);
console.log('===============================================');

const verificacionDirecta = await prisma.$queryRaw`
  SELECT
    id,
    correo,
    "emailVerificado",
    "activo"
  FROM "usuarios"
  WHERE correo = ${correo}
`;

console.log('========== CONSULTA DIRECTA ==========');
console.log(verificacionDirecta);
console.log('=======================================');

console.log('========== DEBUG LOGIN ==========');
console.log('Correo recibido:', correo);
console.log('Usuario ID:', usuario?.id);
console.log('Activo:', usuario?.activo);
console.log('Email verificado:', usuario?.emailVerificado);
console.log('Tipo emailVerificado:', typeof usuario?.emailVerificado);
console.log('=================================');


  if (!usuario) {

    const error = new Error(
      "Correo o contraseña incorrectos"
    );

    error.status = 401;

    throw error;
  }



  if (!usuario.activo) {

    const error = new Error(
      "La cuenta está desactivada"
    );

    error.status = 403;

    throw error;
  }



  if (!usuario.emailVerificado) {

    const error = new Error(
      "Debes verificar tu correo electrónico antes de iniciar sesión"
    );

    error.status = 403;

    throw error;
  }



  const passwordValido =
    await bcrypt.compare(
      password,
      usuario.password
    );


  if (!passwordValido) {

    const error = new Error(
      "Correo o contraseña incorrectos"
    );

    error.status = 401;

    throw error;
  }



  const token = generarToken(usuario);



  return {
    usuario: sanitizeUsuario(usuario),
    token
  };

}

// ===============================
// RECUPERACIÓN DE CONTRASEÑA
// ===============================

async function solicitarRecuperacion({ correo }) {

  const usuario = await prisma.usuario.findUnique({
    where: {
      correo
    }
  });


  // Por seguridad no revelamos si existe o no
  if (!usuario) {
    return {
      mensaje:
        "Si el correo existe, se enviará un enlace de recuperación"
    };
  }


  const token =
    crypto.randomBytes(32).toString("hex");


  const expiresAt =
    new Date(
      Date.now() + 30 * 60 * 1000
    );


  await prisma.passwordResetToken.create({
    data: {
      token,
      expiresAt,
      usuarioId: usuario.id
    }
  });



  await enviarCorreoRecuperacion(
    usuario.correo,
    token
  );


  return {
    mensaje:
      "Si el correo existe, se enviará un enlace de recuperación"
  };

}



// ===============================
// RESTABLECER CONTRASEÑA
// ===============================

async function restablecerPassword({
  token,
  nuevaPassword
}) {


  if (!nuevaPassword || nuevaPassword.length < 8) {

    const error = new Error(
      "La contraseña debe tener al menos 8 caracteres"
    );

    error.status = 400;

    throw error;
  }


  const resetToken =
    await prisma.passwordResetToken.findUnique({
      where: {
        token
      }
    });



  if (
    !resetToken ||
    resetToken.used ||
    resetToken.expiresAt < new Date()
  ) {

    const error = new Error(
      "Token inválido o expirado"
    );

    error.status = 400;

    throw error;
  }



  const hash =
    await bcrypt.hash(
      nuevaPassword,
      BCRYPT_SALT_ROUNDS
    );



  await prisma.$transaction([

    prisma.usuario.update({
      where: {
        id: resetToken.usuarioId
      },
      data: {
        password: hash
      }
    }),


    prisma.passwordResetToken.update({
      where: {
        token
      },
      data: {
        used: true
      }
    })

  ]);



  return {
    mensaje:
      "Contraseña actualizada correctamente"
  };

}

// ===============================
// CAMBIAR CONTRASEÑA (usuario autenticado)
// ===============================

async function cambiarPassword(
  usuarioId,
  passwordActual,
  passwordNueva
) {


  if (!passwordActual || !passwordNueva) {

    const error = new Error(
      "La contraseña actual y la nueva son obligatorias"
    );

    error.status = 400;

    throw error;
  }


  if (passwordNueva.length < 8) {

    const error = new Error(
      "La nueva contraseña debe tener al menos 8 caracteres"
    );

    error.status = 400;

    throw error;
  }


  const usuario =
    await prisma.usuario.findUnique({
      where: {
        id: usuarioId
      }
    });


  if (!usuario) {

    const error = new Error(
      "Usuario no encontrado"
    );

    error.status = 404;

    throw error;
  }


  const passwordValido =
    await bcrypt.compare(
      passwordActual,
      usuario.password
    );


  if (!passwordValido) {

    const error = new Error(
      "La contraseña actual es incorrecta"
    );

    error.status = 401;

    throw error;
  }


  const hash =
    await bcrypt.hash(
      passwordNueva,
      BCRYPT_SALT_ROUNDS
    );


  await prisma.usuario.update({

    where: {
      id: usuarioId
    },

    data: {
      password: hash
    }

  });


  return {
    mensaje:
      "Contraseña actualizada correctamente"
  };

}

// ===============================
// VERIFICAR CORREO ELECTRÓNICO
// ===============================

async function verificarEmail(token) {

  const usuario =
    await prisma.usuario.findFirst({
      where: {
        emailVerificationToken: token
      }
    });

  if (!usuario) {

    const error = new Error(
      "Token de verificación inválido"
    );

    error.status = 400;

    throw error;
  }

  if (
    !usuario.emailVerificationExpires ||
    usuario.emailVerificationExpires < new Date()
  ) {

    const error = new Error(
      "El enlace de verificación ha expirado"
    );

    error.status = 400;

    throw error;
  }

  await prisma.usuario.update({

    where: {
      id: usuario.id
    },

    data: {

      emailVerificado: true,

      emailVerificationToken: null,

      emailVerificationExpires: null

    }

  });

  return {

    mensaje:
      "Correo verificado correctamente"

  };

}

// ===============================
// REENVIAR VERIFICACIÓN DE CORREO
// ===============================

async function reenviarVerificacion(correo) {

  const usuario = await prisma.usuario.findUnique({
    where: {
      correo
    }
  });

  if (!usuario) {
    const error = new Error(
      "No existe un usuario con ese correo"
    );

    error.status = 404;
    throw error;
  }

  if (usuario.emailVerificado) {
    const error = new Error(
      "El correo electrónico ya está verificado"
    );

    error.status = 400;
    throw error;
  }

  const emailVerificationToken =
    crypto.randomBytes(32).toString('hex');

  const emailVerificationExpires =
    new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

  await prisma.usuario.update({
    where: {
      id: usuario.id
    },
    data: {
      emailVerificationToken,
      emailVerificationExpires
    }
  });

  await enviarCorreoVerificacion(
    usuario.correo,
    emailVerificationToken,
    usuario.nombre
  );

  return {
    mensaje: "Correo de verificación enviado correctamente"
  };
}


// ===============================
// PERFIL DE USUARIO
// ===============================

async function obtenerPerfil(usuarioId) {


  const usuario =
    await prisma.usuario.findUnique({

      where: {
        id: usuarioId
      }

    });



  if (!usuario) {

    const error = new Error(
      "Usuario no encontrado"
    );

    error.status = 404;

    throw error;
  }



  return sanitizeUsuario(usuario);

}



// ===============================
// ACTUALIZAR PERFIL
// ===============================

async function actualizarPerfil(
  usuarioId,
  datos
) {


  const {
    nombre,
    apellido,
    telefono,
    profesion,
    empresa,
    ciudad,
    pais
  } = datos;



  const usuario =
    await prisma.usuario.update({

      where: {
        id: usuarioId
      },

      data: {

        nombre,
        apellido,
        telefono,
        profesion,
        empresa,
        ciudad,
        pais

      }

    });



  return sanitizeUsuario(usuario);

}



// ===============================
// CAMBIAR ROL
// ===============================

async function cambiarRol(
  usuarioId,
  nuevoRol
) {


  if (
    !['ADMIN', 'USUARIO']
      .includes(nuevoRol)
  ) {

    const error = new Error(
      "Rol inválido"
    );

    error.status = 400;

    throw error;
  }



  const usuario =
    await prisma.usuario.update({

      where: {
        id: usuarioId
      },

      data: {
        rol: nuevoRol
      }

    });



  return sanitizeUsuario(usuario);

}

// ===============================
// ACTUALIZAR FOTO DE PERFIL
// ===============================

async function actualizarFoto(usuarioId, urlFoto) {

  const usuario = await prisma.usuario.update({
    where: {
      id: usuarioId
    },
    data: {
      foto: urlFoto
    }
  });

  return sanitizeUsuario(usuario);

}

// ===============================
// EXPORTACIONES
// ===============================

module.exports = {

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

};