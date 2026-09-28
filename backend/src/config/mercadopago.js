require('dotenv').config();

const { MercadoPagoConfig } = require('mercadopago');

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

if (!accessToken) {
  console.warn(
    '⚠️ MERCADOPAGO_ACCESS_TOKEN no está configurado. ' +
    'Las funciones de Mercado Pago no estarán disponibles.'
  );
}

const mercadopago = accessToken
  ? new MercadoPagoConfig({
      accessToken
    })
  : null;

module.exports = {
  mercadopago,
  mercadopagoConfigurado: Boolean(mercadopago)
};
