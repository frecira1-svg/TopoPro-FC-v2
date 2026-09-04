const express = require('express');

const router = express.Router();


const {
  protegerRuta
} = require('../middleware/authMiddleware');


const {
  verificarPermiso
} = require('../middleware/permisoMiddleware');


const {
  obtenerClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente
} = require('../controllers/clienteController');


// =====================================================
// AUTENTICACIÓN
// =====================================================

router.use(protegerRuta);


// =====================================================
// CONSULTAR CLIENTES
// =====================================================

router.get(
  '/',
  verificarPermiso('clientesVer'),
  obtenerClientes
);


router.get(
  '/:id',
  verificarPermiso('clientesVer'),
  obtenerCliente
);


// =====================================================
// CREAR
// =====================================================

router.post(
  '/',
  verificarPermiso('clientesCrear'),
  crearCliente
);


// =====================================================
// EDITAR
// =====================================================

router.put(
  '/:id',
  verificarPermiso('clientesEditar'),
  actualizarCliente
);


// =====================================================
// ELIMINAR
// =====================================================

router.delete(
  '/:id',
  verificarPermiso('clientesEliminar'),
  eliminarCliente
);


module.exports = router;