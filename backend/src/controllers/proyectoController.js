const prisma = require('../lib/prisma');


// =====================================================
// OBTENER TODOS LOS PROYECTOS
// =====================================================

const obtenerProyectos = async (req, res) => {

  try {

    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    const proyectos = await prisma.proyecto.findMany({

      where: rol === 'ADMIN'
        ? {}
        : {
            usuarioId
          },

      include: {

        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true
          }
        },

        clienteRelacion: {
          select: {
            id: true,
            nombre: true,
            nit: true,
            telefono: true,
            correo: true,
            direccion: true,
            ciudad: true,
            contacto: true
          }
        }

      },

      orderBy: {
        createdAt: 'desc'
      }

    });

    res.json(proyectos);

  } catch (error) {

    console.error('ERROR OBTENIENDO PROYECTOS:', error);

    res.status(500).json({
      error: 'Error al obtener los proyectos'
    });

  }

};


// =====================================================
// OBTENER UN PROYECTO POR ID
// =====================================================

const obtenerProyecto = async (req, res) => {

  try {

    const id = Number(req.params.id);

    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;


    if (Number.isNaN(id)) {

      return res.status(400).json({
        error: 'ID de proyecto inválido'
      });

    }


    const proyecto = await prisma.proyecto.findFirst({

      where: {

        id,

        ...(rol === 'ADMIN'
          ? {}
          : {
              usuarioId
            })

      },

      include: {

        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
            profesion: true,
            foto: true,
            rol: true
          }
        },

        clienteRelacion: {
          select: {
            id: true,
            nombre: true,
            nit: true,
            telefono: true,
            correo: true,
            direccion: true,
            ciudad: true,
            contacto: true
          }
        }

      }

    });


    if (!proyecto) {

      return res.status(404).json({
        error:
          'Proyecto no encontrado o no tienes permisos para acceder a él'
      });

    }


    res.json(proyecto);

  } catch (error) {

    console.error('ERROR OBTENIENDO PROYECTO:', error);

    res.status(500).json({
      error: 'Error del servidor'
    });

  }

};


// =====================================================
// CREAR PROYECTO
// =====================================================

const crearProyecto = async (req, res) => {

  try {

    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;


    const {
      nombre,
      descripcion,
      clienteId,
      ubicacion,
      estado,
      latitud,
      longitud
    } = req.body;

console.log('========== CREAR PROYECTO ==========');
console.log('BODY RECIBIDO:', req.body);
console.log('clienteId:', clienteId);
console.log('tipo clienteId:', typeof clienteId);
console.log('====================================');


    // -------------------------------------------------
    // Validar nombre
    // -------------------------------------------------

    if (!nombre || !nombre.trim()) {

      return res.status(400).json({
        error: 'El nombre del proyecto es obligatorio'
      });

    }


    // -------------------------------------------------
    // Validar cliente
    // -------------------------------------------------

    const clienteIdNum = Number(clienteId);

    if (
      clienteId === undefined ||
      clienteId === null ||
      clienteId === '' ||
      Number.isNaN(clienteIdNum)
    ) {

      return res.status(400).json({
        error: 'El cliente es obligatorio'
      });

    }


    // -------------------------------------------------
    // Verificar que el cliente existe
    // y pertenece al usuario
    // -------------------------------------------------

    const clienteExiste = await prisma.cliente.findFirst({

      where: {

        id: clienteIdNum,

        ...(rol === 'ADMIN'
          ? {}
          : {
              usuarioId
            })

      }

    });


    if (!clienteExiste) {

      return res.status(400).json({
        error:
          'El cliente no existe o no tienes permisos para utilizarlo'
      });

    }


    // -------------------------------------------------
    // Crear proyecto
    // -------------------------------------------------

    const proyecto = await prisma.proyecto.create({

      data: {

        nombre: nombre.trim(),

        descripcion:
          descripcion?.trim() || null,

        // Mantener campo antiguo por compatibilidad
        cliente:
          clienteExiste.nombre,

        // Nueva relación
        clienteId:
          clienteIdNum,

        ubicacion:
          ubicacion?.trim() || '',

        estado:
          estado || 'EN_PROGRESO',

        latitud:
          latitud ?? null,

        longitud:
          longitud ?? null,

        usuarioId

      },

      include: {

        clienteRelacion: {
          select: {
            id: true,
            nombre: true,
            nit: true,
            telefono: true,
            correo: true,
            direccion: true,
            ciudad: true,
            contacto: true
          }
        }

      }

    });


    res.status(201).json(proyecto);

  } catch (error) {

    console.error('ERROR CREANDO PROYECTO:', error);

    res.status(500).json({
      error: 'Error al crear el proyecto'
    });

  }

};


// =====================================================
// ACTUALIZAR PROYECTO
// =====================================================

const actualizarProyecto = async (req, res) => {

  try {

    const id = Number(req.params.id);

    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;


    // -------------------------------------------------
    // Validar ID
    // -------------------------------------------------

    if (Number.isNaN(id)) {

      return res.status(400).json({
        error: 'ID de proyecto inválido'
      });

    }


    // -------------------------------------------------
    // Verificar existencia y permisos
    // -------------------------------------------------

    const proyecto = await prisma.proyecto.findFirst({

      where: {

        id,

        ...(rol === 'ADMIN'
          ? {}
          : {
              usuarioId
            })

      }

    });


    if (!proyecto) {

      return res.status(404).json({

        error:
          'Proyecto no encontrado o no tienes permisos para modificarlo'

      });

    }


    // -------------------------------------------------
    // Evitar modificar campos protegidos
    // -------------------------------------------------

    const {
      id: idBody,
      usuarioId: usuarioIdBody,
      createdAt,
      updatedAt,
      ...datosActualizacion
    } = req.body;


    // Evitar que lleguen valores indefinidos
    Object.keys(datosActualizacion).forEach((key) => {

      if (datosActualizacion[key] === undefined) {
        delete datosActualizacion[key];
      }

    });


    // -------------------------------------------------
    // Si se está modificando el cliente
    // verificar pertenencia
    // -------------------------------------------------

    if (datosActualizacion.clienteId !== undefined) {

      const clienteIdNum =
        Number(datosActualizacion.clienteId);


      if (
        Number.isNaN(clienteIdNum) ||
        clienteIdNum <= 0
      ) {

        return res.status(400).json({
          error: 'clienteId inválido'
        });

      }


      const clienteExiste =
        await prisma.cliente.findFirst({

          where: {

            id: clienteIdNum,

            ...(rol === 'ADMIN'
              ? {}
              : {
                  usuarioId
                })

          }

        });


      if (!clienteExiste) {

        return res.status(400).json({
          error:
            'El cliente no existe o no tienes permisos para utilizarlo'
        });

      }


      // Normalizar ID
      datosActualizacion.clienteId =
        clienteIdNum;


      // Mantener sincronizado el campo antiguo
      datosActualizacion.cliente =
        clienteExiste.nombre;

    }


    // -------------------------------------------------
    // Si llega cliente como texto antiguo pero NO
    // llega clienteId, NO permitimos cambiarlo
    // independientemente.
    // -------------------------------------------------

    if (
      datosActualizacion.cliente !== undefined &&
      datosActualizacion.clienteId === undefined
    ) {

      delete datosActualizacion.cliente;

    }


    // -------------------------------------------------
    // Actualizar proyecto
    // -------------------------------------------------

    const proyectoActualizado =
      await prisma.proyecto.update({

        where: {
          id
        },

        data: datosActualizacion,

        include: {

          clienteRelacion: {
            select: {
              id: true,
              nombre: true,
              nit: true,
              telefono: true,
              correo: true,
              direccion: true,
              ciudad: true,
              contacto: true
            }
          }

        }

      });


    res.json(proyectoActualizado);

  } catch (error) {

    console.error('ERROR ACTUALIZANDO PROYECTO:', error);

    res.status(500).json({
      error: 'Error al actualizar el proyecto'
    });

  }

};


// =====================================================
// ELIMINAR PROYECTO
// =====================================================

const eliminarProyecto = async (req, res) => {

  try {

    const id = Number(req.params.id);

    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;


    if (Number.isNaN(id)) {

      return res.status(400).json({
        error: 'ID de proyecto inválido'
      });

    }


    // -------------------------------------------------
    // Verificar existencia y permisos
    // -------------------------------------------------

    const proyecto = await prisma.proyecto.findFirst({

      where: {

        id,

        ...(rol === 'ADMIN'
          ? {}
          : {
              usuarioId
            })

      }

    });


    if (!proyecto) {

      return res.status(404).json({

        error:
          'Proyecto no encontrado o no tienes permisos para eliminarlo'

      });

    }


    await prisma.proyecto.delete({

      where: {
        id
      }

    });


    res.json({

      mensaje:
        'Proyecto eliminado correctamente'

    });

  } catch (error) {

    console.error('ERROR ELIMINANDO PROYECTO:', error);

    res.status(500).json({
      error: 'Error al eliminar el proyecto'
    });

  }

};


// =====================================================
// PROYECTOS CERCANOS
// =====================================================

const proyectosCercanosController = async (req, res) => {

  try {

    const {
      lat,
      lng,
      radioKm
    } = req.query;


    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;


    if (!lat || !lng || !radioKm) {

      return res.status(400).json({

        error:
          'lat, lng y radioKm son obligatorios'

      });

    }


    const latNum = Number(lat);
    const lngNum = Number(lng);

    const radioMetros =
      Number(radioKm) * 1000;


    if (
      Number.isNaN(latNum) ||
      Number.isNaN(lngNum) ||
      Number.isNaN(radioMetros)
    ) {

      return res.status(400).json({

        error:
          'Los valores de ubicación deben ser numéricos'

      });

    }


    let proyectos;


    // -------------------------------------------------
    // ADMIN → todos los proyectos cercanos
    // USUARIO → solamente sus proyectos
    // -------------------------------------------------

    if (rol === 'ADMIN') {

      proyectos = await prisma.$queryRaw`

        SELECT

          p.id,
          p.nombre,
          p.descripcion,

          -- Campo antiguo
          p.cliente,

          -- Nueva relación
          p."clienteId",

          c.nombre AS "clienteNombre",

          p.ubicacion,
          p.estado,
          p.latitud,
          p.longitud,

          ST_Distance(

            p.ubicacion_geo,

            ST_SetSRID(

              ST_MakePoint(
                ${lngNum},
                ${latNum}
              ),

              4326

            )::geography

          ) / 1000 AS distancia_km

        FROM proyectos p

        LEFT JOIN clientes c
          ON c.id = p."clienteId"

        WHERE p.ubicacion_geo IS NOT NULL

          AND ST_DWithin(

            p.ubicacion_geo,

            ST_SetSRID(

              ST_MakePoint(
                ${lngNum},
                ${latNum}
              ),

              4326

            )::geography,

            ${radioMetros}

          )

        ORDER BY distancia_km ASC

      `;

    } else {

      proyectos = await prisma.$queryRaw`

        SELECT

          p.id,
          p.nombre,
          p.descripcion,

          -- Campo antiguo
          p.cliente,

          -- Nueva relación
          p."clienteId",

          c.nombre AS "clienteNombre",

          p.ubicacion,
          p.estado,
          p.latitud,
          p.longitud,

          ST_Distance(

            p.ubicacion_geo,

            ST_SetSRID(

              ST_MakePoint(
                ${lngNum},
                ${latNum}
              ),

              4326

            )::geography

          ) / 1000 AS distancia_km

        FROM proyectos p

        LEFT JOIN clientes c
          ON c.id = p."clienteId"

        WHERE p.ubicacion_geo IS NOT NULL

          AND p."usuarioId" = ${usuarioId}

          AND ST_DWithin(

            p.ubicacion_geo,

            ST_SetSRID(

              ST_MakePoint(
                ${lngNum},
                ${latNum}
              ),

              4326

            )::geography,

            ${radioMetros}

          )

        ORDER BY distancia_km ASC

      `;

    }


    res.json(proyectos);

  } catch (error) {

    console.error(
      'ERROR BUSCANDO PROYECTOS CERCANOS:',
      error
    );

    res.status(500).json({

      error:
        'Error al buscar proyectos cercanos'

    });

  }

};


// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {

  obtenerProyectos,
  obtenerProyecto,
  crearProyecto,
  actualizarProyecto,
  eliminarProyecto,
  proyectosCercanosController

};