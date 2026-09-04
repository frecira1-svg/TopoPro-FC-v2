require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET && process.env.JWT_SECRET.trim();

if (!jwtSecret) {
  throw new Error('La variable de entorno JWT_SECRET es obligatoria');
}

module.exports = {
  jwtSecret
};
