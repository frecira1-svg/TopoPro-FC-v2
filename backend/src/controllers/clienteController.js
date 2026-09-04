const prisma = require('../lib/prisma');


// =====================================================
// OBTENER CLIENTES
// =====================================================

const obtenerClientes = async (req, res) => {

  try {

    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    // -------------------------------------------------
    // DIAGNÓSTICO TEMPORAL
    // -------------------------------------------------

    console.log('=================================');
    console.log('CLIENTES - USUARIO AUTENTICADO');
    console.log('usuarioId:', usuarioId);
    console.log('rol:', rol);
    console.log('=================================');

    // -------------------------------------------------
    // CONSULTAR CLIENTES
    // -------------------------------------------------

    const clientes = await prisma.cliente.findMany({

      where:
        rol === 'ADMIN'
          ? {}
          : { usuarioId },

      orderBy: {
        createdAt: 'desc'
      }

    });

    console.log(
      'Clientes encontrados:',
      clientes.length
    );

    res.json(clientes);

  } catch (error) {

    console.error(
      'ERROR AL OBTENER CLIENTES:',
      error
    );

    res.status(500).json({
      error: 'Error al obtener los clientes'
    });

  }

};


// =====================================================
// OBTENER CLIENTE
// =====================================================

const obtenerCliente = async (req, res) => {

  try {

    const id = Number(req.params.id);
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    if (Number.isNaN(id)) {

      return res.status(400).json({
        error: 'ID de cliente inválido'
      });

    }

    const cliente =
      await prisma.cliente.findFirst({

        where: {

          id,

          ...(rol === 'ADMIN'
            ? {}
            : { usuarioId })

        }

      });

    if (!cliente) {

      return res.status(404).json({
        error:
          'Cliente no encontrado o no tienes permisos para acceder a él'
      });

    }

    res.json(cliente);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error del servidor'
    });

  }

};


// =====================================================
// CREAR CLIENTE
// =====================================================

const crearCliente = async (req, res) => {

  try {

    const {
      nombre,
      nit,
      telefono,
      correo,
      direccion,
      ciudad,
      contacto
    } = req.body;

    if (!nombre || !nombre.trim()) {

      return res.status(400).json({
        error: 'El nombre del cliente es obligatorio'
      });

    }

    const cliente =
      await prisma.cliente.create({

        data: {

          nombre,
          nit,
          telefono,
          correo,
          direccion,
          ciudad,
          contacto,

          usuarioId:
            Number(req.usuario.id)

        }

      });

    res.status(201).json(cliente);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error al crear el cliente'
    });

  }

};


// =====================================================
// ACTUALIZAR CLIENTE
// =====================================================

const actualizarCliente = async (req, res) => {

  try {

    const id = Number(req.params.id);
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    if (Number.isNaN(id)) {

      return res.status(400).json({
        error: 'ID de cliente inválido'
      });

    }

    const cliente =
      await prisma.cliente.findFirst({

        where: {

          id,

          ...(rol === 'ADMIN'
            ? {}
            : { usuarioId })

        }

      });

    if (!cliente) {

      return res.status(404).json({
        error:
          'Cliente no encontrado o no tienes permisos para modificarlo'
      });

    }

    const {
      id: idBody,
      usuarioId: usuarioIdBody,
      createdAt,
      updatedAt,
      ...datosActualizacion
    } = req.body;

    const clienteActualizado =
      await prisma.cliente.update({

        where: {
          id
        },

        data:
          datosActualizacion

      });

    res.json(clienteActualizado);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error al actualizar el cliente'
    });

  }

};


// =====================================================
// ELIMINAR CLIENTE
// =====================================================

const eliminarCliente = async (req, res) => {

  try {

    const id = Number(req.params.id);
    const usuarioId = Number(req.usuario.id);
    const rol = req.usuario.rol;

    if (Number.isNaN(id)) {

      return res.status(400).json({
        error: 'ID de cliente inválido'
      });

    }

    const cliente =
      await prisma.cliente.findFirst({

        where: {

          id,

          ...(rol === 'ADMIN'
            ? {}
            : { usuarioId })

        }

      });

    if (!cliente) {

      return res.status(404).json({
        error:
          'Cliente no encontrado o no tienes permisos para eliminarlo'
      });

    }

    await prisma.cliente.delete({

      where: {
        id
      }

    });

    res.json({
      mensaje:
        'Cliente eliminado correctamente'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error al eliminar el cliente'
    });

  }

};


// =====================================================
// EXPORTAR
// =====================================================

module.exports = {

  obtenerClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente

};