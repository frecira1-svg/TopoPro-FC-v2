function errorHandler(err, req, res, next) {

  console.error(err);

  const status = err.status || 500;

  // Los errores con status definido son mensajes intencionales y seguros.
  // Los errores 500 no controlados pueden filtrar detalles internos,
  // así que se les da un mensaje genérico al cliente.
  const mensaje =
    status === 500
      ? 'Error interno del servidor'
      : (err.message || 'Error interno del servidor');

  res.status(status).json({
    error: mensaje
  });

}

module.exports = errorHandler;