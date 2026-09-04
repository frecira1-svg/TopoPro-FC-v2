const prisma = require('../lib/prisma');

const obtenerResumen = async (req, res) => {

  try {

    const [
      proyectos,
      clientes,
      puntos,
      publicaciones
    ] = await Promise.all([

      prisma.proyecto.count(),

      prisma.cliente.count(),

      prisma.puntoTopografico.count(),

      prisma.publicacion.count()

    ]);

    res.json({
      proyectos,
      clientes,
      puntos,
      publicaciones
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error al obtener el resumen del dashboard'
    });

  }

};

module.exports = {
  obtenerResumen
};