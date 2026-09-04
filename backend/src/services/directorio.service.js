const prisma = require('../lib/prisma');

async function listarProfesionales({ busqueda = '', ciudad = '', especialidad = '' } = {}) {
  const texto = String(busqueda || '').trim();
  const ciudadTexto = String(ciudad || '').trim();
  const especialidadTexto = String(especialidad || '').trim();

  const and = [
    { activo: true },
    { publicaciones: { some: {} } }
  ];

  if (texto) {
    and.push({
      OR: [
        { nombre: { contains: texto, mode: 'insensitive' } },
        { apellido: { contains: texto, mode: 'insensitive' } },
        { profesion: { contains: texto, mode: 'insensitive' } },
        { empresa: { contains: texto, mode: 'insensitive' } }
      ]
    });
  }

  if (ciudadTexto) {
    and.push({ ciudad: { contains: ciudadTexto, mode: 'insensitive' } });
  }

  if (especialidadTexto) {
    and.push({
      publicaciones: {
        some: {
          tipoTrabajo: { contains: especialidadTexto, mode: 'insensitive' }
        }
      }
    });
  }

  const usuarios = await prisma.usuario.findMany({
    where: { AND: and },
    orderBy: [{ publicaciones: { _count: 'desc' } }, { nombre: 'asc' }],
    select: {
      id: true,
      nombre: true,
      apellido: true,
      profesion: true,
      empresa: true,
      ciudad: true,
      pais: true,
      foto: true,
      publicaciones: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          titulo: true,
          imagen: true,
          tipoTrabajo: true,
          imagenes: { orderBy: { orden: 'asc' }, take: 1, select: { id: true, url: true, orden: true } }
        }
      },
      _count: { select: { publicaciones: true } }
    }
  });

  return usuarios.map(u => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    profesion: u.profesion,
    empresa: u.empresa,
    ciudad: u.ciudad,
    pais: u.pais,
    foto: u.foto,
    publicacionesCount: u._count.publicaciones,
    especialidades: [...new Set(u.publicaciones.map(p => p.tipoTrabajo).filter(Boolean))].slice(0, 5),
    trabajos: u.publicaciones.map(p => ({
      id: p.id,
      titulo: p.titulo,
      tipoTrabajo: p.tipoTrabajo,
      imagen: p.imagenes[0]?.url || p.imagen || null
    }))
  }));
}

module.exports = { listarProfesionales };
