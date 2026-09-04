const prisma = require('../lib/prisma');

const obtenerLevantamientos = async (req, res) => {
  try {

    const { proyectoId } = req.query;
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    const filtroPermiso =
      rol === 'ADMIN'
        ? {}
        : { proyecto: { usuarioId } };

    const levantamientos = await prisma.levantamiento.findMany({
      where: {
        ...(proyectoId ? { proyectoId: Number(proyectoId) } : {}),
        ...filtroPermiso
      },
      include: {
        proyecto: { select: { id: true, nombre: true } },
        equipo: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true, apellido: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    res.json(levantamientos);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los levantamientos' });
  }
};

const obtenerLevantamiento = async (req, res) => {
  try {

    const id = Number(req.params.id);
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID de levantamiento inválido' });
    }

    const levantamiento = await prisma.levantamiento.findFirst({
      where: {
        id,
        ...(rol === 'ADMIN' ? {} : { proyecto: { usuarioId } })
      },
      include: {
        proyecto: true,
        equipo: true,
        responsable: { select: { id: true, nombre: true, apellido: true } }
      }
    });

    if (!levantamiento) {
      return res.status(404).json({ error: 'Levantamiento no encontrado o no tienes permisos para acceder a él' });
    }

    res.json(levantamiento);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const crearLevantamiento = async (req, res) => {
  try {

    const { fecha, descripcion, observaciones, estado, proyectoId, equipoId } = req.body;
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    if (!proyectoId) {
      return res.status(400).json({ error: 'El proyecto es obligatorio' });
    }

    const proyecto = await prisma.proyecto.findFirst({
      where: {
        id: Number(proyectoId),
        ...(rol === 'ADMIN' ? {} : { usuarioId })
      }
    });

    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado o no tienes permisos sobre él' });
    }

    const levantamiento = await prisma.levantamiento.create({
      data: {
        fecha: fecha ? new Date(fecha) : new Date(),
        descripcion,
        observaciones,
        estado: estado || 'PLANIFICADO',
        proyectoId: Number(proyectoId),
        equipoId: equipoId ? Number(equipoId) : null,
        responsableId: req.usuario.id
      }
    });

    res.status(201).json(levantamiento);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el levantamiento' });
  }
};

const actualizarLevantamiento = async (req, res) => {
  try {

    const id = Number(req.params.id);
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID de levantamiento inválido' });
    }

    const levantamientoExistente = await prisma.levantamiento.findFirst({
      where: {
        id,
        ...(rol === 'ADMIN' ? {} : { proyecto: { usuarioId } })
      }
    });

    if (!levantamientoExistente) {
      return res.status(404).json({ error: 'Levantamiento no encontrado o no tienes permisos para modificarlo' });
    }

    const { fecha, descripcion, observaciones, estado, proyectoId, equipoId } = req.body;

    // Si se cambia de proyecto, verificar permisos sobre el nuevo proyecto también
    if (proyectoId) {

      const nuevoProyecto = await prisma.proyecto.findFirst({
        where: {
          id: Number(proyectoId),
          ...(rol === 'ADMIN' ? {} : { usuarioId })
        }
      });

      if (!nuevoProyecto) {
        return res.status(404).json({ error: 'Proyecto no encontrado o no tienes permisos sobre él' });
      }

    }

    const levantamiento = await prisma.levantamiento.update({
      where: { id },
      data: {
        fecha: fecha ? new Date(fecha) : undefined,
        descripcion,
        observaciones,
        estado,
        proyectoId: proyectoId ? Number(proyectoId) : undefined,
        equipoId: equipoId ? Number(equipoId) : null
      }
    });

    res.json(levantamiento);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

const eliminarLevantamiento = async (req, res) => {
  try {

    const id = Number(req.params.id);
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID de levantamiento inválido' });
    }

    const levantamiento = await prisma.levantamiento.findFirst({
      where: {
        id,
        ...(rol === 'ADMIN' ? {} : { proyecto: { usuarioId } })
      }
    });

    if (!levantamiento) {
      return res.status(404).json({ error: 'Levantamiento no encontrado o no tienes permisos para eliminarlo' });
    }

    await prisma.levantamiento.delete({ where: { id } });

    res.json({ mensaje: 'Levantamiento eliminado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

module.exports = {
  obtenerLevantamientos,
  obtenerLevantamiento,
  crearLevantamiento,
  actualizarLevantamiento,
  eliminarLevantamiento
};