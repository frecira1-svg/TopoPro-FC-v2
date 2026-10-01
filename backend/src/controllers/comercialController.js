const {
  obtenerContextoComercial,
  crearSuscripcionComercial,
  confirmarSuscripcionComercial,
  procesarWebhookMercadoPago
} = require('../services/comercial.service');


// ==========================================
// OBTENER CONTEXTO COMERCIAL
// ==========================================

async function obtenerComercial(req, res) {

  try {

    const usuarioId =
      Number(req.usuario.id);

    const contexto =
      await obtenerContextoComercial(
        usuarioId
      );

    return res.json(contexto);

  } catch (error) {

    console.error(
      'ERROR CONTEXTO COMERCIAL:',
      error
    );

    return res.status(
      error.estadoHttp ||
      error.status ||
      500
    ).json({

      error:
        error.message ||
        'No se pudo obtener la información comercial'

    });

  }

}


// ==========================================
// CREAR SUSCRIPCIÓN COMERCIAL
// ==========================================
//
// Este endpoint YA NO recibe cardTokenId.
//
// El frontend solamente envía:
//
// {
//   codigoPlan: "PROFESSIONAL"
// }
//
// El backend crea/obtiene el checkout
// de Mercado Pago y devuelve initPoint.
// ==========================================

async function crearSuscripcion(req, res) {

  try {

    const usuarioId =
      Number(req.usuario.id);

    const {
      codigoPlan
    } = req.body || {};


    console.log(
      'CREAR SUSCRIPCIÓN COMERCIAL:',
      {
        usuarioId,
        codigoPlan
      }
    );


    const resultado =
      await crearSuscripcionComercial(
        usuarioId,
        {
          codigoPlan
        }
      );


    return res.status(201).json(
      resultado
    );


  } catch (error) {

    console.error(
      'ERROR CREANDO SUSCRIPCIÓN:',
      error
    );


    return res.status(
      error.estadoHttp ||
      error.status ||
      500
    ).json({

      error:
        error.message ||
        'No se pudo crear la suscripción',

      codigo:
        error.codigo ||
        'ERROR_SUSCRIPCION'

    });

  }

}


// ==========================================
// CONFIRMAR SUSCRIPCIÓN MERCADO PAGO
// ==========================================
//
// Mercado Pago devuelve a TopoPro:
//
// ?preapproval_id=XXXXXXXX
//
// Angular envía:
//
// {
//   preapprovalId: "XXXXXXXX"
// }
//
// El backend consulta Mercado Pago,
// verifica que la suscripción esté autorizada
// y la registra en TopoPro.
// ==========================================

async function confirmarSuscripcion(req, res) {

  try {

    const usuarioId =
      Number(req.usuario.id);

    const {
      preapprovalId
    } = req.body || {};


    console.log(
      'CONFIRMAR SUSCRIPCIÓN:',
      {
        usuarioId,
        preapprovalId
      }
    );


    const resultado =
      await confirmarSuscripcionComercial(
        usuarioId,
        {
          preapprovalId
        }
      );


    return res.status(200).json(
      resultado
    );


  } catch (error) {

    console.error(
      'ERROR CONFIRMANDO SUSCRIPCIÓN:',
      error
    );


    return res.status(
      error.estadoHttp ||
      error.status ||
      500
    ).json({

      error:
        error.message ||
        'No se pudo confirmar la suscripción',

      codigo:
        error.codigo ||
        'ERROR_CONFIRMACION_SUSCRIPCION'

    });

  }

}

// ==========================================
// WEBHOOK MERCADO PAGO
// ==========================================

async function recibirWebhookMercadoPago(req, res) {

  try {

    console.log(
      '========== WEBHOOK MERCADO PAGO =========='
    );

    console.log(
      'QUERY:',
      req.query
    );

    console.log(
      'BODY:',
      req.body
    );


    const tipo =
      req.body?.type ||
      req.query?.type ||
      req.body?.topic ||
      req.query?.topic ||
      null;


    // ==========================================
    // IDENTIFICAR ID SEGÚN TIPO DE EVENTO
    // ==========================================

    const dataId =
      req.body?.data?.id ||
      req.query?.['data.id'] ||
      req.query?.id ||
      null;


    console.log(
      'TIPO WEBHOOK:',
      tipo
    );

    console.log(
      'DATA.ID:',
      dataId
    );


    // ==========================================
    // PAGOS AUTORIZADOS DE SUSCRIPCIÓN
    // ==========================================
    //
    // subscription_authorized_payment
    // data.id = ID DEL PAGO
    //
    // NO es un preapproval_id.
    //
    // Por ahora confirmamos recepción y no
    // intentamos consultarlo como suscripción.
    // ==========================================

    if (
      tipo === 'subscription_authorized_payment'
    ) {

      console.log(
        'WEBHOOK DE PAGO DE SUSCRIPCIÓN RECIBIDO.'
      );

      console.log(
        'Payment ID:',
        dataId
      );

      console.log(
        'No se consulta como preapproval.'
      );

      console.log(
        '=========================================='
      );

      return res.sendStatus(200);
    }


    // ==========================================
    // EVENTOS DE SUSCRIPCIÓN
    // ==========================================

    const tiposSuscripcion = [
      'subscription_preapproval',
      'preapproval'
    ];


    if (
      tiposSuscripcion.includes(tipo)
    ) {

      const resultado =
        await procesarWebhookMercadoPago({

          tipo,

          preapprovalId:
            dataId
              ? String(dataId)
              : null

        });


      console.log(
        'RESULTADO WEBHOOK:',
        resultado
      );

    } else {

      console.log(
        'TIPO DE WEBHOOK NO PROCESADO:',
        tipo
      );

    }


    console.log(
      '=========================================='
    );


    // Mercado Pago espera HTTP 200.
    return res.sendStatus(200);


  } catch (error) {

    console.error(
      'ERROR WEBHOOK MERCADO PAGO:',
      error
    );

    // Mercado Pago espera una respuesta rápida.
    return res.sendStatus(200);

  }

}


// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {

  obtenerComercial,

  crearSuscripcion,

  confirmarSuscripcion,

  recibirWebhookMercadoPago

};