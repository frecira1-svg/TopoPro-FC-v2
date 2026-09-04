const { verificarToken } = require('../utils/jwt');
const {
  obtenerPermisos
} = require('../services/permiso.service');


// =====================================================
// PROTEGER RUTA
// =====================================================

function protegerRuta(req, res, next) {

  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {

    return res.status(401).json({
      error: 'No se proporcionó un token de acceso'
    });

  }

  const token =
    authHeader.split(' ')[1];

  try {

    const payload =
      verificarToken(token);


    if (
      payload.emailVerificado === false
    ) {

      return res.status(403).json({
        error:
          'Debes verificar tu correo electrónico para acceder a esta función'
      });

    }


    req.usuario = payload;

    next();

  } catch (error) {

    return res.status(401).json({
      error: 'Token inválido o expirado'
    });

  }

}


// =====================================================
// VERIFICAR ROL
// =====================================================

function verificarRol(...rolesPermitidos) {

  return (req, res, next) => {

    if (
      !req.usuario ||
      !rolesPermitidos.includes(
        req.usuario.rol
      )
    ) {

      return res.status(403).json({
        error:
          'No tienes permisos para realizar esta acción'
      });

    }

    next();

  };

}


// =====================================================
// VERIFICAR PERMISO
// =====================================================
//
// ADMIN
// → Tiene acceso completo.
//
// USUARIO
// → Se consulta PermisoUsuario.
//
// Ejemplo:
//
// verificarPermiso('proyectosCrear')
//
// =====================================================

function verificarPermiso(nombrePermiso) {

  return async (req, res, next) => {

    try {

      if (!req.usuario) {

        return res.status(401).json({
          error:
            'Usuario no autenticado'
        });

      }


      // -------------------------------------------------
      // ADMIN TIENE TODOS LOS PERMISOS
      // -------------------------------------------------

      if (
        req.usuario.rol === 'ADMIN'
      ) {

        return next();

      }


      // -------------------------------------------------
      // OBTENER PERMISOS DEL USUARIO
      // -------------------------------------------------

      const permisos =
        await obtenerPermisos(
          Number(req.usuario.id)
        );


      // -------------------------------------------------
      // VERIFICAR QUE EL PERMISO EXISTA
      // -------------------------------------------------

      if (
        typeof permisos[nombrePermiso] !==
        'boolean'
      ) {

        console.error(
          `Permiso no definido: ${nombrePermiso}`
        );

        return res.status(500).json({
          error:
            `El permiso "${nombrePermiso}" no está definido`
        });

      }


      // -------------------------------------------------
      // PERMISO DENEGADO
      // -------------------------------------------------

      if (
        permisos[nombrePermiso] !== true
      ) {

        return res.status(403).json({
          error:
            `No tienes permiso para realizar esta acción (${nombrePermiso})`
        });

      }


      // -------------------------------------------------
      // PERMISO CONCEDIDO
      // -------------------------------------------------

      next();

    } catch (error) {

      console.error(
        'Error verificando permiso:',
        error
      );

      return res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          'No se pudo verificar el permiso'
      });

    }

  };

}


// =====================================================
// EXPORTAR
// =====================================================

module.exports = {

  protegerRuta,
  verificarRol,
  verificarPermiso

};