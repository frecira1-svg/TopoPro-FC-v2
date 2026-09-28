const { PreApproval } = require('mercadopago');

const {
  mercadopago,
  mercadopagoConfigurado
} = require('../config/mercadopago');

const PLANES = {
  PROFESSIONAL: process.env.MERCADOPAGO_PLAN_PROFESSIONAL_ID,
  COMPANY: process.env.MERCADOPAGO_PLAN_COMPANY_ID
};

/**
 * Verifica que Mercado Pago y los planes estén configurados.
 */
function verificarConfiguracion() {
  if (!mercadopagoConfigurado || !mercadopago) {
    const error = new Error(
      'Mercado Pago no está configurado correctamente.'
    );

    error.codigo = 'MERCADOPAGO_NO_CONFIGURADO';
    error.estadoHttp = 500;

    throw error;
  }

  if (!PLANES.PROFESSIONAL || !PLANES.COMPANY) {
    const error = new Error(
      'No están configurados los IDs de los planes de Mercado Pago.'
    );

    error.codigo = 'PLANES_MERCADOPAGO_NO_CONFIGURADOS';
    error.estadoHttp = 500;

    throw error;
  }
}

/**
 * Obtiene el ID del plan de Mercado Pago.
 */
function obtenerPlanId(codigoPlan) {
  const codigo = String(codigoPlan || '')
    .trim()
    .toUpperCase();

  if (!PLANES[codigo]) {
    const error = new Error(
      'Plan de Mercado Pago no soportado.'
    );

    error.codigo = 'PLAN_MERCADOPAGO_INVALIDO';
    error.estadoHttp = 400;

    throw error;
  }

  return PLANES[codigo];
}

/**
 * Obtiene el correo que se utilizará como payer_email.
 *
 * En modo de prueba utilizamos:
 *
 * MERCADOPAGO_TEST_PAYER_EMAIL
 *
 * En producción utilizamos el correo real recibido.
 */
function obtenerPayerEmail(payerEmail) {
  const modoPrueba =
    String(process.env.MERCADOPAGO_TEST_MODE || '')
      .trim()
      .toLowerCase() === 'true';

  if (modoPrueba) {
    const emailPrueba = String(
      process.env.MERCADOPAGO_TEST_PAYER_EMAIL || ''
    ).trim();

    if (!emailPrueba) {
      const error = new Error(
        'MERCADOPAGO_TEST_PAYER_EMAIL no está configurado.'
      );

      error.codigo = 'TEST_PAYER_EMAIL_REQUERIDO';
      error.estadoHttp = 500;

      throw error;
    }

    return emailPrueba;
  }

  const emailReal = String(payerEmail || '').trim();

  if (!emailReal) {
    const error = new Error(
      'El correo del pagador es obligatorio.'
    );

    error.codigo = 'PAYER_EMAIL_REQUERIDO';
    error.estadoHttp = 400;

    throw error;
  }

  return emailReal;
}

/**
 * Crea una suscripción en Mercado Pago.
 */
async function crearSuscripcion({
  codigoPlan,
  payerEmail,
  externalReference,
  cardTokenId
}) {
  verificarConfiguracion();

  if (!cardTokenId) {
    const error = new Error(
      'El card_token_id es obligatorio para una suscripción con plan asociado.'
    );

    error.codigo = 'CARD_TOKEN_REQUERIDO';
    error.estadoHttp = 400;

    throw error;
  }

  const preapproval = new PreApproval(mercadopago);

  const planId = obtenerPlanId(codigoPlan);

  const emailFinal = obtenerPayerEmail(payerEmail);

  console.log('========== DEBUG MERCADO PAGO ==========');
  console.log('PLAN:', planId);
  console.log('PAYER EMAIL:', emailFinal);
  console.log(
    'EXTERNAL REFERENCE:',
    String(externalReference || '')
  );
  console.log(
    'CARD TOKEN PRESENTE:',
    Boolean(cardTokenId)
  );
  console.log(
    'MODO PRUEBA:',
    process.env.MERCADOPAGO_TEST_MODE
  );
  console.log('========================================');

  const respuesta = await preapproval.create({
    body: {
      preapproval_plan_id: planId,
      external_reference: String(externalReference),
      payer_email: emailFinal,
      card_token_id: cardTokenId,
      back_url:
        process.env.APP_URL ||
        'https://topopro-fc.com',
      status: 'authorized'
    }
  });

  return respuesta;
}

/**
 * Obtiene una suscripción desde Mercado Pago.
 */
async function obtenerSuscripcionMercadoPago(
  proveedorSuscripcionId
) {
  verificarConfiguracion();

  if (!proveedorSuscripcionId) {
    const error = new Error(
      'El ID de suscripción de Mercado Pago es obligatorio.'
    );

    error.codigo = 'SUSCRIPCION_ID_REQUERIDO';
    error.estadoHttp = 400;

    throw error;
  }

  const preapproval = new PreApproval(mercadopago);

  return await preapproval.get({
    id: String(proveedorSuscripcionId)
  });
}

/**
 * Actualiza una suscripción existente en Mercado Pago.
 */
async function actualizarSuscripcionMercadoPago(
  proveedorSuscripcionId,
  datos
) {
  verificarConfiguracion();

  if (!proveedorSuscripcionId) {
    const error = new Error(
      'El ID de suscripción de Mercado Pago es obligatorio.'
    );

    error.codigo = 'SUSCRIPCION_ID_REQUERIDO';
    error.estadoHttp = 400;

    throw error;
  }

  const preapproval = new PreApproval(mercadopago);

  return await preapproval.update({
    id: String(proveedorSuscripcionId),
    body: datos
  });
}

module.exports = {
  crearSuscripcion,
  obtenerSuscripcionMercadoPago,
  actualizarSuscripcionMercadoPago,
  obtenerPlanId
};