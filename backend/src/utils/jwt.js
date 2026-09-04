const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function verificarToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { verificarToken };