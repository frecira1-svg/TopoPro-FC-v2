const prisma = require('../lib/prisma');


async function generarReporteProyecto(
  proyectoId,
  usuario
) {

  if (
    !Number.isInteger(proyectoId) ||
    proyectoId <= 0
  ) {

    const error = new Error(
      'El ID del proyecto no es válido'
    );

    error.status = 400;

    throw error;
  }


  // ==========================================
  // OBTENER PROYECTO
  // ==========================================

  const proyecto = await prisma.proyecto.findUnique({

    where: {
      id: proyectoId
    },

    include: {

      usuario: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          correo: true,
          empresa: true,
          profesion: true
        }
      },

      puntos: {
        orderBy: {
          id: 'asc'
        }
      },

      levantamientos: {
        include: {
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
      },

      equipos: {
        orderBy: {
          nombre: 'asc'
        }
      },

      archivos: {
        orderBy: {
          createdAt: 'desc'
        }
      }

    }

  });


  // ==========================================
  // VALIDAR EXISTENCIA
  // ==========================================

  if (!proyecto) {

    const error = new Error(
      'El proyecto no existe'
    );

    error.status = 404;

    throw error;
  }


  // ==========================================
  // VALIDAR PROPIETARIO
  // ==========================================

  if (
    usuario.rol !== 'ADMIN' &&
    Number(proyecto.usuarioId) !== Number(usuario.id)
  ) {

    const error = new Error(
      'No tienes permisos para consultar este reporte'
    );

    error.status = 403;

    throw error;
  }


  // ==========================================
  // ESTADÍSTICAS DE PUNTOS
  // ==========================================

  const puntos = proyecto.puntos;

  const elevaciones = puntos
    .map(p => Number(p.elevacion))
    .filter(Number.isFinite);


  const elevacionMinima =
    elevaciones.length > 0
      ? Math.min(...elevaciones)
      : null;


  const elevacionMaxima =
    elevaciones.length > 0
      ? Math.max(...elevaciones)
      : null;


  const elevacionPromedio =
    elevaciones.length > 0
      ? elevaciones.reduce(
          (total, valor) => total + valor,
          0
        ) / elevaciones.length
      : null;


  // ==========================================
  // TIPOS DE PUNTOS
  // ==========================================

  const puntosPorTipo = {};

  for (const punto of puntos) {

    const tipo =
      punto.tipo || 'SIN_TIPO';

    puntosPorTipo[tipo] =
      (puntosPorTipo[tipo] || 0) + 1;

  }


  // ==========================================
  // ESTADOS DE LEVANTAMIENTOS
  // ==========================================

  const levantamientosPorEstado = {};

  for (
    const levantamiento
    of proyecto.levantamientos
  ) {

    const estado =
      levantamiento.estado || 'SIN_ESTADO';

    levantamientosPorEstado[estado] =
      (levantamientosPorEstado[estado] || 0) + 1;

  }


  // ==========================================
  // RESPUESTA
  // ==========================================

  return {

    proyecto: {

      id: proyecto.id,

      nombre: proyecto.nombre,

      descripcion: proyecto.descripcion,

      cliente: proyecto.cliente,

      ubicacion: proyecto.ubicacion,

      estado: proyecto.estado,

      fechaInicio: proyecto.fechaInicio,

      fechaFin: proyecto.fechaFin,

      latitud: proyecto.latitud,

      longitud: proyecto.longitud

    },


    responsable: proyecto.usuario,


    estadisticas: {

      totalPuntos: puntos.length,

      totalLevantamientos:
        proyecto.levantamientos.length,

      totalEquipos:
        proyecto.equipos.length,

      totalArchivos:
        proyecto.archivos.length,

      elevacionMinima,

      elevacionMaxima,

      elevacionPromedio,

      puntosPorTipo,

      levantamientosPorEstado

    },


    puntos: puntos.map(punto => ({

      id: punto.id,

      codigo: punto.codigo,

      norte: punto.norte,

      este: punto.este,

      elevacion: punto.elevacion,

      descripcion: punto.descripcion,

      tipo: punto.tipo,

      precision: punto.precision,

      equipo: punto.equipo,

      metodo: punto.metodo,

      observaciones: punto.observaciones,

      latitud: punto.latitud,

      longitud: punto.longitud,

      createdAt: punto.createdAt

    })),


    levantamientos:
      proyecto.levantamientos.map(levantamiento => ({

        id: levantamiento.id,

        fecha: levantamiento.fecha,

        descripcion: levantamiento.descripcion,

        observaciones: levantamiento.observaciones,

        estado: levantamiento.estado,

        equipo: levantamiento.equipo
          ? {
              id: levantamiento.equipo.id,
              nombre: levantamiento.equipo.nombre,
              tipo: levantamiento.equipo.tipo,
              marca: levantamiento.equipo.marca,
              modelo: levantamiento.equipo.modelo
            }
          : null,

        responsable:
          levantamiento.responsable

      })),


    equipos:
      proyecto.equipos.map(equipo => ({

        id: equipo.id,

        nombre: equipo.nombre,

        tipo: equipo.tipo,

        marca: equipo.marca,

        modelo: equipo.modelo,

        numeroSerie: equipo.numeroSerie,

        estado: equipo.estado,

        fechaCompra: equipo.fechaCompra

      })),


    archivos:
      proyecto.archivos.map(archivo => ({

        id: archivo.id,

        nombre: archivo.nombre,

        url: archivo.url,

        tipo: archivo.tipo,

        createdAt: archivo.createdAt

      }))

  };

}


module.exports = {
  generarReporteProyecto
};