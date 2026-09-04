const prisma = require('../lib/prisma');

// ============================================
// LISTAR LEVANTAMIENTOS
// ============================================

async function obtenerLevantamientos() {
  return await prisma.levantamiento.findMany({
    include: {
      proyecto: true,
      equipo: true,
      responsable: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          correo: true
        }
      }
    },
    orderBy: {
      fecha: 'desc'
    }
  });
}

// ============================================
// OBTENER POR ID
// ============================================

async function obtenerLevantamientoPorId(id) {
  const levantamiento = await prisma.levantamiento.findUnique({
    where: { id },
    include: {
      proyecto: true,
      equipo: true,
      responsable: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          correo: true
        }
      }
    }
  });

  if (!levantamiento) {
    const error = new Error('El levantamiento no existe');
    error.status = 404;
    throw error;
  }

  return levantamiento;
}

// ============================================
// CREAR
// ============================================

async function crearLevantamiento({
  fecha,
  descripcion,
  observaciones,
  estado,
  proyectoId,
  equipoId,
  responsableId
}) {
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: proyectoId }
  });

  if (!proyecto) {
    const error = new Error('El proyecto no existe');
    error.status = 404;
    throw error;
  }

  if (equipoId) {
    const equipo = await prisma.equipo.findUnique({
      where: { id: equipoId }
    });

    if (!equipo) {
      const error = new Error('El equipo no existe');
      error.status = 404;
      throw error;
    }
  }

  const responsable = await prisma.usuario.findUnique({
    where: { id: responsableId }
  });

  if (!responsable) {
    const error = new Error('El responsable no existe');
    error.status = 404;
    throw error;
  }

  return await prisma.levantamiento.create({
    data: {
      fecha: fecha ? new Date(fecha) : undefined,
      descripcion,
      observaciones,
      estado: estado || 'PLANIFICADO',
      proyectoId,
      equipoId: equipoId || null,
      responsableId
    },
    include: {
      proyecto: true,
      equipo: true,
      responsable: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          correo: true
        }
      }
    }
  });
}

// ============================================
// ACTUALIZAR
// ============================================

async function actualizarLevantamiento(id, datos) {
  await obtenerLevantamientoPorId(id);

  const data = {};

  if (datos.fecha !== undefined) {
    data.fecha = new Date(datos.fecha);
  }

  if (datos.descripcion !== undefined) {
    data.descripcion = datos.descripcion;
  }

  if (datos.observaciones !== undefined) {
    data.observaciones = datos.observaciones;
  }

  if (datos.estado !== undefined) {
    data.estado = datos.estado;
  }

  if (datos.proyectoId !== undefined) {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: Number(datos.proyectoId) }
    });

    if (!proyecto) {
      const error = new Error('El proyecto no existe');
      error.status = 404;
      throw error;
    }

    data.proyectoId = Number(datos.proyectoId);
  }

  if (datos.equipoId !== undefined) {
    if (datos.equipoId === null) {
      data.equipoId = null;
    } else {
      const equipo = await prisma.equipo.findUnique({
        where: { id: Number(datos.equipoId) }
      });

      if (!equipo) {
        const error = new Error('El equipo no existe');
        error.status = 404;
        throw error;
      }

      data.equipoId = Number(datos.equipoId);
    }
  }

  if (datos.responsableId !== undefined) {
    const responsable = await prisma.usuario.findUnique({
      where: { id: Number(datos.responsableId) }
    });

    if (!responsable) {
      const error = new Error('El responsable no existe');
      error.status = 404;
      throw error;
    }

    data.responsableId = Number(datos.responsableId);
  }

  return await prisma.levantamiento.update({
    where: { id },
    data,
    include: {
      proyecto: true,
      equipo: true,
      responsable: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          correo: true
        }
      }
    }
  });
}

// ============================================
// ELIMINAR
// ============================================

async function eliminarLevantamiento(id) {
  await obtenerLevantamientoPorId(id);

  return await prisma.levantamiento.delete({
    where: { id }
  });
}

module.exports = {
  obtenerLevantamientos,
  obtenerLevantamientoPorId,
  crearLevantamiento,
  actualizarLevantamiento,
  eliminarLevantamiento
};