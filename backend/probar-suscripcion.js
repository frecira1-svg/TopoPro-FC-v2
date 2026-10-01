require('dotenv').config();

const { obtenerSuscripcionMercadoPago } = require('./src/services/mercadopago.service');

obtenerSuscripcionMercadoPago('113f9db60e7f4866b7bb471df1ecab9f')
  .then(s => console.log(s.status, s.payer_email, s.preapproval_plan_id))
  .catch(console.error);