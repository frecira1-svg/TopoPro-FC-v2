const prisma = require('../lib/prisma');

const obtenerEquipos = async (req, res) => {
  try {

    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    const equipos = await prisma.equipo.findMany({
      where: rol === 'ADMIN' ? {} : { usuarioId },
      include: { proyecto: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(equipos);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los equipos' });
  }
};

const obtenerEquipo = async (req, res) => {
  try {

    const id = Number(req.params.id);
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID de equipo inválido' });
    }

    const equipo = await prisma.equipo.findFirst({
      where: {
        id,
        ...(rol === 'ADMIN' ? {} : { usuarioId })
      },
      include: { proyecto: true }
    });

    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado o no tienes permisos para acceder a él' });
    }

    res.json(equipo);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const crearEquipo = async (req, res) => {
  try {

    const { nombre, tipo, marca, modelo, numeroSerie, fechaCompra, estado, proyectoId } = req.body;

    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });
    }

    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    let usuarioIdFinal = usuarioId;

    // Si se asigna a un proyecto, el equipo hereda el dueño de ese proyecto
    if (proyectoId) {

      const proyecto = await prisma.proyecto.findFirst({
        where: {
          id: Number(proyectoId),
          ...(rol === 'ADMIN' ? {} : { usuarioId })
        }
      });

      if (!proyecto) {
        return res.status(404).json({ error: 'Proyecto no encontrado o no tienes permisos sobre él' });
      }

      usuarioIdFinal = proyecto.usuarioId;

    }

    const equipo = await prisma.equipo.create({
      data: {
        nombre,
        tipo,
        marca,
        modelo,
        numeroSerie,
        fechaCompra: fechaCompra ? new Date(fechaCompra) : null,
        estado: estado || 'DISPONIBLE',
        proyectoId: proyectoId ? Number(proyectoId) : null,
        usuarioId: usuarioIdFinal
      }
    });

    res.status(201).json(equipo);

  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un equipo con ese número de serie' });
    }
    res.status(500).json({ error: 'Error al crear el equipo' });
  }
};

const actualizarEquipo = async (req, res) => {
  try {

    const id = Number(req.params.id);
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID de equipo inválido' });
    }

    const equipoExistente = await prisma.equipo.findFirst({
      where: {
        id,
        ...(rol === 'ADMIN' ? {} : { usuarioId })
      }
    });

    if (!equipoExistente) {
      return res.status(404).json({ error: 'Equipo no encontrado o no tienes permisos para modificarlo' });
    }

    const { nombre, tipo, marca, modelo, numeroSerie, fechaCompra, estado, proyectoId } = req.body;

    let usuarioIdFinal = equipoExistente.usuarioId;

    // Si se cambia de proyecto, hereda el dueño del nuevo proyecto
    if (proyectoId !== undefined && proyectoId !== null) {

      const proyecto = await prisma.proyecto.findFirst({
        where: {
          id: Number(proyectoId),
          ...(rol === 'ADMIN' ? {} : { usuarioId })
        }
      });

      if (!proyecto) {
        return res.status(404).json({ error: 'Proyecto no encontrado o no tienes permisos sobre él' });
      }

      usuarioIdFinal = proyecto.usuarioId;

    }

    const equipo = await prisma.equipo.update({
      where: { id },
      data: {
        nombre,
        tipo,
        marca,
        modelo,
        numeroSerie,
        fechaCompra: fechaCompra ? new Date(fechaCompra) : null,
        estado,
        proyectoId: proyectoId ? Number(proyectoId) : null,
        usuarioId: usuarioIdFinal
      }
    });

    res.json(equipo);

  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un equipo con ese número de serie' });
    }
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

const eliminarEquipo = async (req, res) => {
  try {

    const id = Number(req.params.id);
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID de equipo inválido' });
    }

    const equipo = await prisma.equipo.findFirst({
      where: {
        id,
        ...(rol === 'ADMIN' ? {} : { usuarioId })
      }
    });

    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado o no tienes permisos para eliminarlo' });
    }

    await prisma.equipo.delete({ where: { id } });

    res.json({ mensaje: 'Equipo eliminado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

module.exports = {
  obtenerEquipos,
  obtenerEquipo,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo
};