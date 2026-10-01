const {
  PreApproval,
  PreApprovalPlan
} = require('mercadopago');

const {
  mercadopago,
  mercadopagoConfigurado
} = require('../config/mercadopago');


// ==========================================
// PLANES MERCADO PAGO
// ==========================================

const PLANES = {

  PROFESSIONAL:
    process.env.MERCADOPAGO_PLAN_PROFESSIONAL_ID,

  COMPANY:
    process.env.MERCADOPAGO_PLAN_COMPANY_ID

};


// ==========================================
// VERIFICAR CONFIGURACIÓN
// ==========================================

function verificarConfiguracion() {

  if (
    !mercadopagoConfigurado ||
    !mercadopago
  ) {

    const error = new Error(
      'Mercado Pago no está configurado correctamente.'
    );

    error.codigo =
      'MERCADOPAGO_NO_CONFIGURADO';

    error.estadoHttp = 500;

    throw error;

  }


  if (
    !PLANES.PROFESSIONAL ||
    !PLANES.COMPANY
  ) {

    const error = new Error(
      'No están configurados los IDs de los planes de Mercado Pago.'
    );

    error.codigo =
      'PLANES_MERCADOPAGO_NO_CONFIGURADOS';

    error.estadoHttp = 500;

    throw error;

  }

}


// ==========================================
// OBTENER ID DEL PLAN
// ==========================================

function obtenerPlanId(codigoPlan) {

  const codigo =
    String(codigoPlan || '')
      .trim()
      .toUpperCase();


  if (!PLANES[codigo]) {

    const error = new Error(
      'Plan de Mercado Pago no soportado.'
    );

    error.codigo =
      'PLAN_MERCADOPAGO_INVALIDO';

    error.estadoHttp = 400;

    throw error;

  }


  return PLANES[codigo];

}


// ==========================================
// OBTENER EMAIL DEL PAGADOR
// ==========================================

function obtenerPayerEmail(payerEmail) {

  const modoPrueba =
    String(
      process.env.MERCADOPAGO_TEST_MODE || ''
    )
      .trim()
      .toLowerCase() === 'true';


  if (modoPrueba) {

    const emailPrueba =
      String(
        process.env.MERCADOPAGO_TEST_PAYER_EMAIL || ''
      ).trim();


    if (!emailPrueba) {

      const error = new Error(
        'MERCADOPAGO_TEST_PAYER_EMAIL no está configurado.'
      );

      error.codigo =
        'TEST_PAYER_EMAIL_REQUERIDO';

      error.estadoHttp = 500;

      throw error;

    }


    return emailPrueba;

  }


  const emailReal =
    String(
      payerEmail || ''
    ).trim();


  if (!emailReal) {

    const error = new Error(
      'El correo del pagador es obligatorio.'
    );

    error.codigo =
      'PAYER_EMAIL_REQUERIDO';

    error.estadoHttp = 400;

    throw error;

  }


  return emailReal;

}


// ==========================================
// CREAR / OBTENER CHECKOUT DE SUSCRIPCIÓN
// ==========================================
//
// IMPORTANTE:
//
// NO crea un /preapproval.
//
// NO utiliza card_token_id.
//
// Obtiene el plan existente de Mercado Pago
// y devuelve su init_point.
//
// El usuario completa el medio de pago
// directamente en Mercado Pago.
// ==========================================

async function crearSuscripcion({

  codigoPlan,
  payerEmail,
  externalReference

}) {

  verificarConfiguracion();


  const planId =
    obtenerPlanId(
      codigoPlan
    );


  const emailFinal =
    obtenerPayerEmail(
      payerEmail
    );


  console.log(
    '========== CHECKOUT MERCADO PAGO =========='
  );


  console.log(
    'PLAN TOPOPRO:',
    codigoPlan
  );


  console.log(
    'PLAN MERCADO PAGO:',
    planId
  );


  console.log(
    'PAYER EMAIL:',
    emailFinal
  );


  console.log(
    'EXTERNAL REFERENCE:',
    String(
      externalReference || ''
    )
  );


  console.log(
    'MODO PRUEBA:',
    process.env.MERCADOPAGO_TEST_MODE
  );


  console.log(
    '==========================================='
  );


  // ========================================
  // CONSULTAR PLAN EXISTENTE
  // ========================================

  const preapprovalPlan =
    new PreApprovalPlan(
      mercadopago
    );


  const planMercadoPago =
    await preapprovalPlan.get({

      preApprovalPlanId:
        String(planId)

    });


  console.log(
    'PLAN MERCADO PAGO OBTENIDO:',
    {

      id:
        planMercadoPago?.id ||
        null,

      status:
        planMercadoPago?.status ||
        null,

      init_point:
        planMercadoPago?.init_point ||
        null

    }
  );


  // ========================================
  // VALIDAR INIT POINT
  // ========================================

  const initPoint =
    planMercadoPago?.init_point ||
    null;


  if (!initPoint) {

    const error = new Error(
      'Mercado Pago no devolvió el init_point del plan.'
    );

    error.codigo =
      'MERCADOPAGO_INIT_POINT_NO_RECIBIDO';

    error.estadoHttp = 502;

    throw error;

  }


  // ========================================
  // RESPUESTA
  // ========================================

  return {

    id:
      null,

    status:
      'pending',

    initPoint,

    preapprovalPlanId:
      String(planId),

    payerEmail:
      emailFinal,

    externalReference:
      String(
        externalReference || ''
      )

  };

}


// ==========================================
// OBTENER SUSCRIPCIÓN
// ==========================================

async function obtenerSuscripcionMercadoPago(
  proveedorSuscripcionId
) {

  verificarConfiguracion();


  if (!proveedorSuscripcionId) {

    const error = new Error(
      'El ID de suscripción de Mercado Pago es obligatorio.'
    );

    error.codigo =
      'SUSCRIPCION_ID_REQUERIDO';

    error.estadoHttp = 400;

    throw error;

  }


  const preapproval =
    new PreApproval(
      mercadopago
    );


  return await preapproval.get({

    id:
      String(
        proveedorSuscripcionId
      )

  });

}


// ==========================================
// ACTUALIZAR SUSCRIPCIÓN
// ==========================================

async function actualizarSuscripcionMercadoPago(
  proveedorSuscripcionId,
  datos
) {

  verificarConfiguracion();


  if (!proveedorSuscripcionId) {

    const error = new Error(
      'El ID de suscripción de Mercado Pago es obligatorio.'
    );

    error.codigo =
      'SUSCRIPCION_ID_REQUERIDO';

    error.estadoHttp = 400;

    throw error;

  }


  const preapproval =
    new PreApproval(
      mercadopago
    );


  return await preapproval.update({

    id:
      String(
        proveedorSuscripcionId
      ),

    body:
      datos

  });

}


// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {

  crearSuscripcion,

  obtenerSuscripcionMercadoPago,

  actualizarSuscripcionMercadoPago,

  obtenerPlanId

};
