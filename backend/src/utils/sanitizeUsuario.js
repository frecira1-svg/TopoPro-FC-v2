function sanitizeUsuario(usuario) {
  const {
    password,
    emailVerificationToken,
    emailVerificationExpires,
    ...usuarioLimpio
  } = usuario;

  return usuarioLimpio;
}

module.exports = { sanitizeUsuario };