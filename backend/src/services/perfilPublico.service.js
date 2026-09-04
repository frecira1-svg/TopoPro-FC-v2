const prisma = require('../lib/prisma');

async function obtenerPerfilPublico(id) {
  const usuarioId = Number(id);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    const error = new Error('Perfil no válido');
    error.status = 400;
    throw error;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId, activo: true },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      profesion: true,
      empresa: true,
      ciudad: true,
      pais: true,
      foto: true,
      fechaRegistro: true,
      publicaciones: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          titulo: true,
          contenido: true,
          tipo: true,
          imagen: true,
          tipoTrabajo: true,
          ubicacion: true,
          etiquetas: true,
          usuarioId: true,
          createdAt: true,
          updatedAt: true,
          usuario: {
            select: { id: true, nombre: true, apellido: true, foto: true }
          },
          _count: { select: { comentarios: true } },
          imagenes: { orderBy: { orden: 'asc' } }
        }
      }
    }
  });

  if (!usuario) {
    const error = new Error('Perfil no encontrado');
    error.status = 404;
    throw error;
  }

  return {
    ...usuario,
    publicacionesCount: usuario.publicaciones.length
  };
}

module.exports = { obtenerPerfilPublico };
