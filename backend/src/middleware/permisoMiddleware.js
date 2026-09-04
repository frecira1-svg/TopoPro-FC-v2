const {
  obtenerPermisos
} = require('../services/permiso.service');


// =====================================================
// VERIFICAR PERMISO DEL USUARIO
// =====================================================

function verificarPermiso(nombrePermiso) {

  return async (req, res, next) => {

    try {

      // -------------------------------------------------
      // USUARIO AUTENTICADO
      // -------------------------------------------------

      if (!req.usuario) {

        return res.status(401).json({
          error: 'Usuario no autenticado'
        });

      }


      // -------------------------------------------------
      // ADMIN = ACCESO TOTAL
      // -------------------------------------------------

      if (req.usuario.rol === 'ADMIN') {

        return next();

      }


      // -------------------------------------------------
      // OBTENER PERMISOS
      // -------------------------------------------------

      const permisos =
        await obtenerPermisos(
          Number(req.usuario.id)
        );


      // -------------------------------------------------
      // VERIFICAR QUE EL PERMISO EXISTA
      // -------------------------------------------------

      if (
        typeof permisos[nombrePermiso] !== 'boolean'
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
      // VERIFICAR PERMISO
      // -------------------------------------------------

      if (
        permisos[nombrePermiso] !== true
      ) {

        return res.status(403).json({

          error:
            `No tienes permiso para realizar esta acción (${nombrePermiso})`

        });

      }


      next();

    } catch (error) {

      console.error(
        'ERROR VERIFICANDO PERMISO:',
        error
      );

      return res.status(
        error.status || 500
      ).json({

        error:
          error.message ||
          'Error al verificar permisos'

      });

    }

  };

}


module.exports = {
  verificarPermiso
};