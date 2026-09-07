const prisma = require('../lib/prisma');

const obtenerResumen = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id);
    const esAdmin = req.usuario.rol === 'ADMIN';

    let proyectos;
    let clientes;
    let levantamientos;
    let equipos;

    if (esAdmin) {
      [
        proyectos,
        clientes,
        levantamientos,
        equipos
      ] = await Promise.all([
        prisma.proyecto.count(),

        prisma.cliente.count(),

        prisma.levantamiento.count(),

        prisma.equipo.count()
      ]);
    } else {
      [
        proyectos,
        clientes,
        levantamientos,
        equipos
      ] = await Promise.all([
        prisma.proyecto.count({
          where: {
            usuarioId
          }
        }),

        prisma.cliente.count({
          where: {
            usuarioId
          }
        }),

        prisma.levantamiento.count({
          where: {
            proyecto: {
              usuarioId
            }
          }
        }),

        prisma.equipo.count({
          where: {
            usuarioId
          }
        })
      ]);
    }

    res.json({
      proyectos,
      clientes,
      levantamientos,
      equipos
    });

  } catch (error) {
    console.error('Error en obtenerResumen:', error);

    res.status(500).json({
      error: 'Error al obtener el resumen del dashboard'
    });
  }
};

module.exports = {
  obtenerResumen
};