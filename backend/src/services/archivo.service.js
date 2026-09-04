const prisma = require('../lib/prisma');


// ===============================
// VALIDAR PERMISOS SOBRE PROYECTO
// ===============================

async function verificarPermisoProyecto(proyectoId, usuario) {

  const proyecto = await prisma.proyecto.findUnique({
    where: { id: Number(proyectoId) }
  });

  if (!proyecto) {
    const error = new Error('El proyecto no existe');
    error.status = 404;
    throw error;
  }

  if (
    usuario.rol !== 'ADMIN' &&
    Number(proyecto.usuarioId) !== Number(usuario.id)
  ) {
    const error = new Error('No tienes permisos sobre este proyecto');
    error.status = 403;
    throw error;
  }

  return proyecto;

}


// ===============================
// VALIDAR PERMISOS SOBRE PUNTO
// ===============================

async function verificarPermisoPunto(puntoId, usuario) {

  const punto = await prisma.puntoTopografico.findUnique({
    where: { id: Number(puntoId) },
    include: { proyecto: true }
  });

  if (!punto) {
    const error = new Error('El punto topográfico no existe');
    error.status = 404;
    throw error;
  }

  if (
    usuario.rol !== 'ADMIN' &&
    Number(punto.proyecto.usuarioId) !== Number(usuario.id)
  ) {
    const error = new Error('No tienes permisos sobre este punto topográfico');
    error.status = 403;
    throw error;
  }

  return punto;

}


// ===============================
// SUBIR ARCHIVO (PROYECTO O PUNTO)
// ===============================

async function crearArchivo({
  nombre,
  url,
  tipo,
  proyectoId,
  puntoId
}, usuario) {

  if (!proyectoId && !puntoId) {
    const error = new Error('Debes indicar un proyectoId o un puntoId');
    error.status = 400;
    throw error;
  }

  if (proyectoId) {
    await verificarPermisoProyecto(proyectoId, usuario);
  }

  if (puntoId) {
    await verificarPermisoPunto(puntoId, usuario);
  }

  const archivo = await prisma.archivo.create({
    data: {
      nombre,
      url,
      tipo,
      proyectoId: proyectoId ? Number(proyectoId) : null,
      puntoId: puntoId ? Number(puntoId) : null
    }
  });

  return archivo;

}


// ===============================
// LISTAR ARCHIVOS DE UN PROYECTO
// ===============================

async function obtenerArchivosPorProyecto(proyectoId, usuario) {

  await verificarPermisoProyecto(proyectoId, usuario);

  return await prisma.archivo.findMany({
    where: {
      proyectoId: Number(proyectoId)
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

}


// ===============================
// LISTAR ARCHIVOS DE UN PUNTO
// ===============================

async function obtenerArchivosPorPunto(puntoId, usuario) {

  await verificarPermisoPunto(puntoId, usuario);

  return await prisma.archivo.findMany({
    where: {
      puntoId: Number(puntoId)
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

}


// ===============================
// ELIMINAR ARCHIVO
// ===============================

async function eliminarArchivo(id, usuario) {

  const archivo = await prisma.archivo.findUnique({
    where: { id: Number(id) },
    include: {
      proyecto: true,
      punto: { include: { proyecto: true } }
    }
  });

  if (!archivo) {
    const error = new Error('Archivo no encontrado');
    error.status = 404;
    throw error;
  }

  const proyectoDueno =
    archivo.proyecto?.usuarioId ??
    archivo.punto?.proyecto?.usuarioId;

  if (
    usuario.rol !== 'ADMIN' &&
    Number(proyectoDueno) !== Number(usuario.id)
  ) {
    const error = new Error('No tienes permisos para eliminar este archivo');
    error.status = 403;
    throw error;
  }

  await prisma.archivo.delete({
    where: { id: Number(id) }
  });

  return { mensaje: 'Archivo eliminado correctamente' };

}


module.exports = {
  crearArchivo,
  obtenerArchivosPorProyecto,
  obtenerArchivosPorPunto,
  eliminarArchivo
};