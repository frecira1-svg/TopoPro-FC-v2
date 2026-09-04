function validateId(req, res, next) {
  const params = req.params || {};
  const idParams = ['id', 'proyectoId'].filter((param) =>
    Object.prototype.hasOwnProperty.call(params, param)
  );

  const idsValidos = idParams.every((param) => {
    const id = Number(params[param]);
    return Number.isInteger(id) && id > 0;
  });

  if (!idsValidos) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  next();
}

module.exports = validateId;
