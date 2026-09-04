const prisma = require('../lib/prisma');
const { cloudinary } = require('../config/cloudinary');

async function crearPublicacion({ titulo, contenido, tipo, imagen, tipoTrabajo, ubicacion, etiquetas, usuarioId, rolUsuario, imagenes = [] }) {
  if (tipo === 'NOTICIA' && rolUsuario !== 'ADMIN') {
    const error = new Error('Solo un administrador puede publicar noticias');
    error.status = 403;
    throw error;
  }

  const publicacion = await prisma.publicacion.create({
    data: { titulo, contenido, tipo: tipo || 'COMUNIDAD', imagen, tipoTrabajo, ubicacion, etiquetas, usuarioId }
  });

  if (imagenes.length) {
    await prisma.publicacionImagen.createMany({
      data: imagenes.map((file, index) => ({
        url: file.path,
        publicId: file.filename || null,
        nombre: file.originalname || null,
        orden: index,
        publicacionId: publicacion.id
      }))
    });
  }

  return prisma.publicacion.findUnique({
    where: { id: publicacion.id },
    include: { imagenes: { orderBy: { orden: 'asc' } } }
  });
}

async function obtenerPublicaciones(tipo) {
  return prisma.publicacion.findMany({
    where: tipo ? { tipo } : {},
    include: {
      usuario: { select: { id: true, nombre: true, apellido: true, foto: true } },
      _count: { select: { comentarios: true } },
      imagenes: { orderBy: { orden: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function obtenerPublicacionPorId(id) {
  const publicacion = await prisma.publicacion.findUnique({
    where: { id: Number(id) },
    include: {
      usuario: { select: { id: true, nombre: true, apellido: true, foto: true } },
      imagenes: { orderBy: { orden: 'asc' } },
      comentarios: {
        include: { usuario: { select: { id: true, nombre: true, apellido: true, foto: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  if (!publicacion) {
    const error = new Error('Publicación no encontrada'); error.status = 404; throw error;
  }
  return publicacion;
}

async function actualizarPublicacion(id, datos, usuarioId, rolUsuario) {
  const publicacion = await prisma.publicacion.findUnique({ where: { id: Number(id) } });
  if (!publicacion) { const error = new Error('Publicación no encontrada'); error.status = 404; throw error; }
  if (publicacion.usuarioId !== usuarioId && rolUsuario !== 'ADMIN') { const error = new Error('No tienes permiso para editar esta publicación'); error.status = 403; throw error; }

  const archivosNuevos = datos.imagenes || [];
  await prisma.publicacion.update({
    where: { id: Number(id) },
    data: {
      titulo: datos.titulo,
      contenido: datos.contenido,
      imagen: archivosNuevos.length ? archivosNuevos[0].path : (datos.imagen || publicacion.imagen),
      tipoTrabajo: datos.tipoTrabajo,
      ubicacion: datos.ubicacion,
      etiquetas: datos.etiquetas
    }
  });

  if (archivosNuevos.length) {
    const actual = await prisma.publicacionImagen.findMany({
      where: { publicacionId: Number(id) },
      orderBy: { orden: 'asc' }
    });

    if (actual.length) {
      await prisma.$transaction(
        actual.map((imagen, index) => prisma.publicacionImagen.update({
          where: { id: imagen.id },
          data: { orden: archivosNuevos.length + index }
        }))
      );
    }

    await prisma.publicacionImagen.createMany({
      data: archivosNuevos.map((file, index) => ({
        url: file.path, publicId: file.filename || null, nombre: file.originalname || null,
        orden: index, publicacionId: Number(id)
      }))
    });
  }

  return prisma.publicacion.findUnique({
    where: { id: Number(id) },
    include: { imagenes: { orderBy: { orden: 'asc' } } }
  });
}

async function eliminarPublicacion(id, usuarioId, rolUsuario) {
  const publicacion = await prisma.publicacion.findUnique({ where: { id: Number(id) }, include: { imagenes: true } });
  if (!publicacion) { const error = new Error('Publicación no encontrada'); error.status = 404; throw error; }
  if (publicacion.usuarioId !== usuarioId && rolUsuario !== 'ADMIN') { const error = new Error('No tienes permiso para eliminar esta publicación'); error.status = 403; throw error; }

  for (const imagen of publicacion.imagenes || []) {
    if (imagen.publicId) {
      try { await cloudinary.uploader.destroy(imagen.publicId); } catch (error) { console.warn('No se pudo eliminar imagen de Cloudinary:', error.message); }
    }
  }
  await prisma.publicacion.delete({ where: { id: Number(id) } });
  return { mensaje: 'Publicación eliminada correctamente' };
}

async function crearComentario({ contenido, usuarioId, publicacionId }) {
  const publicacion = await prisma.publicacion.findUnique({ where: { id: Number(publicacionId) } });
  if (!publicacion) { const error = new Error('Publicación no encontrada'); error.status = 404; throw error; }
  return prisma.comentario.create({
    data: { contenido, usuarioId, publicacionId: Number(publicacionId) },
    include: { usuario: { select: { id: true, nombre: true, apellido: true, foto: true } } }
  });
}

async function eliminarComentario(id, usuarioId, rolUsuario) {
  const comentario = await prisma.comentario.findUnique({ where: { id: Number(id) } });
  if (!comentario) { const error = new Error('Comentario no encontrado'); error.status = 404; throw error; }
  if (comentario.usuarioId !== usuarioId && rolUsuario !== 'ADMIN') { const error = new Error('No tienes permiso para eliminar este comentario'); error.status = 403; throw error; }
  await prisma.comentario.delete({ where: { id: Number(id) } });
  return { mensaje: 'Comentario eliminado correctamente' };
}

module.exports = { crearPublicacion, obtenerPublicaciones, obtenerPublicacionPorId, actualizarPublicacion, eliminarPublicacion, crearComentario, eliminarComentario };
