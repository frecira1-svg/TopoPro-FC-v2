const prisma = require('../lib/prisma');


// =====================================================
// PERMISOS POR DEFECTO
// =====================================================

const PERMISOS_POR_DEFECTO = {

  proyectosVer: true,
  proyectosCrear: true,
  proyectosEditar: true,
  proyectosEliminar: true,

  clientesVer: true,
  clientesCrear: true,
  clientesEditar: true,
  clientesEliminar: true,

  levantamientosVer: true,
  levantamientosCrear: true,
  levantamientosEditar: true,
  levantamientosEliminar: true,

  equiposVer: true,
  equiposCrear: true,
  equiposEditar: true,
  equiposEliminar: true,

  reportesVer: true,
  reportesCrear: true,
  reportesEditar: true,
  reportesEliminar: true,

  mapasVer: true

};


// =====================================================
// OBTENER USUARIOS
// =====================================================

async function obtenerUsuarios() {

  return await prisma.usuario.findMany({

    select: {
      id: true,
      nombre: true,
      apellido: true,
      correo: true,
      rol: true
    },

    orderBy: {
      nombre: 'asc'
    }

  });

}


// =====================================================
// OBTENER PERMISOS
// =====================================================

async function obtenerPermisos(usuarioId) {

  const id = Number(usuarioId);

  const usuario = await prisma.usuario.findUnique({

    where: {
      id
    }

  });

  if (!usuario) {

    const error =
      new Error('Usuario no encontrado');

    error.status = 404;

    throw error;

  }


  let permisos =
    await prisma.permisoUsuario.findUnique({

      where: {
        usuarioId: id
      }

    });


  // ---------------------------------------------------
  // CREAR PERMISOS SI NO EXISTEN
  // ---------------------------------------------------

  if (!permisos) {

    permisos =
      await prisma.permisoUsuario.create({

        data: {
          usuarioId: id,
          ...PERMISOS_POR_DEFECTO
        }

      });

  }


  return permisos;

}


// =====================================================
// ACTUALIZAR PERMISOS
// =====================================================

async function actualizarPermisos(
  usuarioId,
  datos,
  usuarioSolicitante
) {

  if (usuarioSolicitante.rol !== 'ADMIN') {

    const error =
      new Error(
        'No tienes permisos para modificar permisos de usuarios'
      );

    error.status = 403;

    throw error;

  }


  const id = Number(usuarioId);


  const usuario =
    await prisma.usuario.findUnique({

      where: {
        id
      }

    });


  if (!usuario) {

    const error =
      new Error('Usuario no encontrado');

    error.status = 404;

    throw error;

  }


  // ---------------------------------------------------
  // SOLO CAMPOS DE PERMISOS
  // ---------------------------------------------------

  const camposPermitidos =
    Object.keys(PERMISOS_POR_DEFECTO);

  const dataLimpia = {};


  for (const campo of camposPermitidos) {

    if (typeof datos[campo] === 'boolean') {

      dataLimpia[campo] =
        datos[campo];

    }

  }


  // ---------------------------------------------------
  // UPSERT
  // ---------------------------------------------------

  const permisos =
    await prisma.permisoUsuario.upsert({

      where: {
        usuarioId: id
      },

      update: dataLimpia,

      create: {

        usuarioId: id,

        ...PERMISOS_POR_DEFECTO,

        ...dataLimpia

      }

    });


  return permisos;

}


// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {

  obtenerUsuarios,
  obtenerPermisos,
  actualizarPermisos

};