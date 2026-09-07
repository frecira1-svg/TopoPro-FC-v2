require('./config/env');

// Comprobación segura de DATABASE_URL.
// NO muestra la contraseña ni la URL completa.
console.log(
  'DATABASE_URL válida:',
  /^(postgresql|postgres):\/\//.test(process.env.DATABASE_URL || '')
);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const proyectoRoutes = require('./routes/proyectoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const puntoTopograficoRoutes = require('./routes/puntoTopografico.routes');
const levantamientoRoutes = require('./routes/levantamientoRoutes');
const archivoRoutes = require('./routes/archivo.routes');
const publicacionRoutes = require('./routes/publicacion.routes');
const perfilPublicoRoutes = require('./routes/perfilPublico.routes');
const directorioRoutes = require('./routes/directorio.routes');
const contactoProfesionalRoutes = require('./routes/contactoProfesional.routes');
const mensajeriaRoutes = require('./routes/mensajeria.routes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const equipoRoutes = require('./routes/equipoRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const permisoRoutes = require('./routes/permiso.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
  origin: [
    process.env.APP_URL,
    'https://topopro-fc-web.onrender.com',
    'http://localhost:4200'
  ],
  credentials: true
}));

app.use(express.json());

// Limita intentos de login/registro/recuperación para evitar fuerza bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 intentos por IP en la ventana
  message: {
    error: 'Demasiados intentos. Intenta de nuevo en unos minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/puntos', puntoTopograficoRoutes);
app.use('/api/levantamientos', levantamientoRoutes);
app.use('/api/archivos', archivoRoutes);
app.use('/api/publicaciones', publicacionRoutes);
app.use('/api/perfiles-publicos', perfilPublicoRoutes);
app.use('/api/directorio', directorioRoutes);
app.use('/api/contactos-profesionales', contactoProfesionalRoutes);
app.use('/api/mensajes', mensajeriaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/permisos', permisoRoutes);

app.get('/', (req, res) => {
  res.json({
    mensaje: 'API de TopoPro funcionando'
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada'
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [TopoPro Backend] Servidor corriendo en el puerto ${PORT}`);
});