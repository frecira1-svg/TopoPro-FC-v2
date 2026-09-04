const express = require('express');

const router = express.Router();

const { upload } = require('../config/cloudinary');

const {
  registro,
  login,
  recuperarPassword,
  restablecerPasswordController,
  verificarEmailController,
  reenviarVerificacionController,
  perfil,
  actualizarPerfilController,
  cambiarRolController,
  subirFotoPerfil,
  cambiarPasswordController
} = require('../controllers/authController');

const {
  protegerRuta,
  verificarRol
} = require('../middleware/authMiddleware');


// ===============================
// AUTENTICACIÓN
// ===============================

router.post(
  '/registro',
  registro
);

router.post(
  '/login',
  login
);

router.post(
  '/recuperar',
  recuperarPassword
);

router.post(
  '/restablecer',
  restablecerPasswordController
);


// ===============================
// VERIFICACIÓN DE CORREO
// ===============================

router.get(
  '/verificar-email',
  verificarEmailController
);

router.post(
  '/reenviar-verificacion',
  reenviarVerificacionController
);


// ===============================
// PERFIL
// ===============================

router.get(
  '/perfil',
  protegerRuta,
  perfil
);

router.put(
  '/perfil',
  protegerRuta,
  actualizarPerfilController
);

router.put(
  '/perfil/foto',
  protegerRuta,
  upload.single('foto'),
  subirFotoPerfil
);

router.put(
  '/perfil/password',
  protegerRuta,
  cambiarPasswordController
);


// ===============================
// ADMIN
// ===============================

router.put(
  '/rol',
  protegerRuta,
  verificarRol('ADMIN'),
  cambiarRolController
);


module.exports = router;
