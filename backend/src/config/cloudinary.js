const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===============================
// STORAGE PARA FOTOS DE PERFIL
// ===============================

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'topopro/perfiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }]
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

// ===============================
// STORAGE PARA ARCHIVOS DE PROYECTOS/PUNTOS
// ===============================

const storageArchivos = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'topopro/archivos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    resource_type: 'auto'
  }
});

const uploadArchivo = multer({
  storage: storageArchivos,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB máximo
});

// ===============================
// STORAGE PARA FOTOS DE PUBLICACIONES
// ===============================

const storagePublicaciones = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'topopro/publicaciones',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1600, height: 1200, crop: 'limit', quality: 'auto' }]
  }
});

const uploadPublicacion = multer({
  storage: storagePublicaciones,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes JPG, JPEG, PNG o WEBP'));
    }
    cb(null, true);
  }
});

const uploadPublicaciones = multer({
  storage: storagePublicaciones,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imágenes JPG, JPEG o WEBP'));
    }
    cb(null, true);
  }
});

module.exports = { upload, uploadArchivo, uploadPublicacion, uploadPublicaciones, cloudinary };