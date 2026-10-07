const prisma = require('../config/prisma');

const {
  crearSuscripcion,
  obtenerSuscripcionMercadoPago,
  obtenerPlanId
} = require('./mercadopago.service');


// ==========================================
// ESTADOS COMERCIALES
// ==========================================

const ESTADO_PENDIENTE = 'PENDIENTE';
const ESTADO_ACTIVA = 'ACTIVA';
const ESTADO_CANCELADA = 'CANCELADA';
const ESTADO_PAUSADA = 'VENCIDA'; // El enum EstadoSuscripcion no tiene PAUSADA


// ==========================================
// OBTENER CONTEXTO COMERCIAL
// ==========================================

async function obtenerContextoComercial(usuarioId) {

  const idUsuario = Number(usuarioId);

  if (
    !Number.isInteger(idUsuario) ||
    idUsuario <= 0
  ) {

    const error = new Error(
      'El ID del usuario no es válido.'
    );

    error.codigo = 'USUARIO_ID_INVALIDO';
    error.estadoHttp = 400;

    throw error;
  }


  const usuario =
    await prisma.usuario.findUnique({

      where: {
        id: idUsuario
      },

      include: {

        suscripcion: {

          include: {
            plan: true
          }

        }

      }

    });


  if (!usuario) {

    const error = new Error(
      'Usuario no encontrado.'
    );

    error.codigo = 'USUARIO_NO_ENCONTRADO';
    error.estadoHttp = 404;

    throw error;
  }


  if (usuario.rol === 'ADMIN') {

    return {
      usuarioId: usuario.id,
      rol: usuario.rol,
      esAdmin: true,
      plan: null,
      suscripcion: null,
      esFree: false,
      puedeExportar: true,
      puedeCrearProyecto: true,
      puedeAdministrarEquipos: true
    };

  }

  const planFree =
    await prisma.plan.findFirst({
      where: {
        codigo: 'FREE',
        activo: true
      }
    });

  if (!planFree) {

    const error = new Error(
      'El plan FREE no está configurado.'
    );

    error.codigo = 'PLAN_FREE_NO_CONFIGURADO';
    error.estadoHttp = 500;

    throw error;
  }

  const suscripcionActiva =
    usuario.suscripcion &&
    usuario.suscripcion.estado === 'ACTIVE'
      ? usuario.suscripcion
      : null;

  const plan =
    suscripcionActiva?.plan || planFree;

  const esFree =
    plan.codigo === 'FREE';

  return {
    usuarioId: usuario.id,
    rol: usuario.rol,
    esAdmin: false,
    plan,
    suscripcion: suscripcionActiva,
    esFree,
    puedeExportar: Boolean(plan.permiteExportacion),
    puedeCrearProyecto: true,
    puedeAdministrarEquipos: !esFree
  };

}


// ==========================================
// VERIFICAR CREACIÓN DE PROYECTO
// ==========================================

async function verificarPuedeCrearProyecto(usuarioId) {

  const contexto =
    await obtenerContextoComercial(
      usuarioId
    );

  if (contexto.esAdmin) {
    return true;
  }

  if (!contexto.plan) {

    const error = new Error(
      'No se encontró un plan comercial para el usuario.'
    );

    error.codigo =
      'PLAN_NO_ENCONTRADO';

    error.estadoHttp = 403;

    throw error;
  }

  if (
    !contexto.esFree &&
    !contexto.suscripcion
  ) {

    const error = new Error(
      'El usuario no tiene una suscripción activa.'
    );

    error.codigo =
      'SUSCRIPCION_REQUERIDA';

    error.estadoHttp = 403;

    throw error;
  }

  if (
    contexto.suscripcion &&
    contexto.suscripcion.estado !==
    ESTADO_ACTIVA
  ) {

    const error = new Error(
      'La suscripción no está activa.'
    );

    error.codigo =
      'SUSCRIPCION_NO_ACTIVA';

    error.estadoHttp = 403;

    throw error;
  }

  if (
    contexto.plan.maxProyectos !== null &&
    contexto.plan.maxProyectos !== undefined
  ) {

    const cantidadProyectos =
      await prisma.proyecto.count({
        where: {
          usuarioId
        }
      });

    if (
      cantidadProyectos >=
      contexto.plan.maxProyectos
    ) {

      const error = new Error(
        `Has alcanzado el límite de ${contexto.plan.maxProyectos} proyecto(s) de tu plan.`
      );

      error.codigo =
        'LIMITE_PROYECTOS';

      error.estadoHttp = 403;

      throw error;
    }
  }

  return true;
}


async function verificarPuedeAgregarPunto(
  usuarioId,
  proyectoId,
  cantidad = 1
) {

  const contexto =
    await obtenerContextoComercial(
      usuarioId
    );

  if (contexto.esAdmin) {
    return true;
  }

  if (!contexto.plan) {

    const error = new Error(
      'No se encontró un plan comercial para el usuario.'
    );

    error.codigo =
      'PLAN_NO_ENCONTRADO';

    error.estadoHttp = 403;

    throw error;
  }

  if (
    !contexto.esFree &&
    !contexto.suscripcion
  ) {

    const error = new Error(
      'El usuario no tiene una suscripción activa.'
    );

    error.codigo =
      'SUSCRIPCION_REQUERIDA';

    error.estadoHttp = 403;

    throw error;
  }

  if (
    contexto.suscripcion &&
    contexto.suscripcion.estado !==
    ESTADO_ACTIVA
  ) {

    const error = new Error(
      'La suscripción no está activa.'
    );

    error.codigo =
      'SUSCRIPCION_NO_ACTIVA';

    error.estadoHttp = 403;

    throw error;
  }

  if (
    contexto.plan.maxPuntosProyecto === null ||
    contexto.plan.maxPuntosProyecto === undefined
  ) {
    return true;
  }

  if (!proyectoId) {

    const error = new Error(
      'El proyecto es obligatorio para validar el límite de puntos.'
    );

    error.codigo =
      'PROYECTO_REQUERIDO';

    error.estadoHttp = 400;

    throw error;
  }

  if (
    !Number.isInteger(cantidad) ||
    cantidad < 1
  ) {

    const error = new Error(
      'La cantidad de puntos debe ser un número entero mayor que cero.'
    );

    error.codigo =
      'CANTIDAD_PUNTOS_INVALIDA';

    error.estadoHttp = 400;

    throw error;
  }

  const proyecto =
    await prisma.proyecto.findFirst({
      where: {
        id: Number(proyectoId),
        usuarioId
      },
      select: {
        id: true
      }
    });

  if (!proyecto) {

    const error = new Error(
      'El proyecto no existe o no pertenece al usuario.'
    );

    error.codigo =
      'PROYECTO_NO_ENCONTRADO';

    error.estadoHttp = 404;

    throw error;
  }

  const cantidadActual =
    await prisma.puntoTopografico.count({
      where: {
        proyectoId: proyecto.id
      }
    });

  const cantidadFinal =
    cantidadActual + cantidad;

  if (
    cantidadFinal >
    contexto.plan.maxPuntosProyecto
  ) {

    const error = new Error(
      `El proyecto supera el límite de ${contexto.plan.maxPuntosProyecto} puntos permitido por tu plan.`
    );

    error.codigo =
      'LIMITE_PUNTOS_PROYECTO';

    error.estadoHttp = 403;

    throw error;
  }

  return true;
}


async function verificarPuedeAdministrarEquipos(
  usuarioId
) {

  const contexto =
    await obtenerContextoComercial(
      usuarioId
    );

  if (contexto.esAdmin) {
    return true;
  }

  if (!contexto.plan) {

    const error = new Error(
      'No se encontró un plan comercial para el usuario.'
    );

    error.codigo =
      'PLAN_NO_ENCONTRADO';

    error.estadoHttp = 403;

    throw error;
  }

  if (!contexto.puedeAdministrarEquipos) {

    const error = new Error(
      'La administración de equipos requiere un plan de pago.'
    );

    error.codigo =
      'EQUIPOS_REQUIEREN_PLAN';

    error.estadoHttp = 403;

    throw error;
  }

  if (
    !contexto.suscripcion ||
    contexto.suscripcion.estado !==
    ESTADO_ACTIVA
  ) {

    const error = new Error(
      'El usuario no tiene una suscripción activa.'
    );

    error.codigo =
      'SUSCRIPCION_REQUERIDA';

    error.estadoHttp = 403;

    throw error;
  }

  return true;
}


async function verificarPuedeExportar(
  usuarioId
) {

  const contexto =
    await obtenerContextoComercial(
      usuarioId
    );

  if (contexto.esAdmin) {
    return true;
  }

  if (!contexto.plan) {

    const error = new Error(
      'No se encontró un plan comercial para el usuario.'
    );

    error.codigo =
      'PLAN_NO_ENCONTRADO';

    error.estadoHttp = 403;

    throw error;
  }

  if (!contexto.puedeExportar) {

    const error = new Error(
      'La exportación requiere un plan de pago.'
    );

    error.codigo =
      'EXPORTACION_NO_DISPONIBLE';

    error.estadoHttp = 403;

    throw error;
  }

  if (
    !contexto.suscripcion ||
    contexto.suscripcion.estado !==
    ESTADO_ACTIVA
  ) {

    const error = new Error(
      'El usuario no tiene una suscripción activa.'
    );

    error.codigo =
      'SUSCRIPCION_REQUERIDA';

    error.estadoHttp = 403;

    throw error;
  }

  return true;
}

// ==========================================
// CREAR SUSCRIPCIÓN COMERCIAL
// ==========================================
//
// El backend crea la suscripción en Mercado Pago.
// Mercado Pago devuelve init_point.
// El frontend utiliza initPoint para enviar
// al usuario al checkout.
//

async function crearSuscripcionComercial(
  usuarioId,
  {
    codigoPlan,
    payerEmail
  }
) {

  const idUsuario = Number(usuarioId);

  // ==========================================
  // VALIDAR USUARIO
  // ==========================================

  if (
    !Number.isInteger(idUsuario) ||
    idUsuario <= 0
  ) {

    const error = new Error(
      'El ID del usuario no es válido.'
    );

    error.codigo = 'USUARIO_ID_INVALIDO';
    error.estadoHttp = 400;

    throw error;
  }


  // ==========================================
  // BUSCAR USUARIO
  // ==========================================

  const usuario =
    await prisma.usuario.findUnique({

      where: {
        id: idUsuario
      },

      select: {
        id: true,
        correo: true
      }

    });


  if (!usuario) {

    const error = new Error(
      'Usuario no encontrado.'
    );

    error.codigo = 'USUARIO_NO_ENCONTRADO';
    error.estadoHttp = 404;

    throw error;
  }


  // ==========================================
  // VALIDAR PLAN
  // ==========================================

  const codigo =
    String(codigoPlan || '')
      .trim()
      .toUpperCase();


  const planMercadoPagoId =
    obtenerPlanId(codigo);


  // ==========================================
  // BUSCAR PLAN EN TOPOPRO
  // ==========================================

  const plan =
    await prisma.plan.findUnique({

      where: {
        codigo
      }

    });


  if (!plan) {

    const error = new Error(
      'El plan no existe en TopoPro.'
    );

    error.codigo = 'PLAN_NO_ENCONTRADO';
    error.estadoHttp = 404;

    throw error;
  }


  // ==========================================
  // CREAR / OBTENER CHECKOUT MERCADO PAGO
  // ==========================================

  const respuestaMercadoPago =
    await crearSuscripcion({

      codigoPlan: codigo,

      payerEmail:
        payerEmail ||
        usuario.correo,

      externalReference:
        String(idUsuario)

    });


  // ==========================================
  // INIT POINT
  // ==========================================

  const initPoint =
    respuestaMercadoPago?.initPoint ||
    respuestaMercadoPago?.init_point ||
    null;


  if (!initPoint) {

    const error = new Error(
      'Mercado Pago no devolvió el enlace de checkout.'
    );

    error.codigo =
      'MERCADOPAGO_INIT_POINT_NO_RECIBIDO';

    error.estadoHttp = 502;

    throw error;
  }


  // ==========================================
  // ID DE SUSCRIPCIÓN
  // ==========================================
  //
  // En este flujo todavía NO existe un
  // preapproval creado para el usuario.
  //
  // El usuario primero entra al checkout.
  // Mercado Pago generará la suscripción
  // después de completar/autorizAR el proceso.
  // ==========================================

  const proveedorSuscripcionId =
    respuestaMercadoPago?.id
      ? String(respuestaMercadoPago.id)
      : null;


  // ==========================================
  // GUARDAR ESTADO PENDIENTE
  // ==========================================

  const suscripcion =
    await prisma.suscripcion.upsert({

      where: {
        usuarioId: idUsuario
      },

      create: {

        usuarioId:
          idUsuario,

        planId:
          plan.id,

        estado:
          ESTADO_PENDIENTE,

        proveedor:
          'MERCADOPAGO',

        proveedorSuscripcionId:
          proveedorSuscripcionId,

        fechaInicio:
          new Date(),

        fechaFin:
          null

      },

      update: {

        planId:
          plan.id,

        estado:
          ESTADO_PENDIENTE,

        proveedor:
          'MERCADOPAGO',

        proveedorSuscripcionId:
          proveedorSuscripcionId,

        fechaInicio:
          new Date(),

        fechaFin:
          null

      },

      include: {
        plan: true
      }

    });


  // ==========================================
  // RESPUESTA AL FRONTEND
  // ==========================================

  return {

    suscripcion,

    mercadoPago: {

      id:
        proveedorSuscripcionId,

      status:
        respuestaMercadoPago?.status ||
        'PENDING',

      planId:
        planMercadoPagoId,

      initPoint:
        initPoint,

      preapprovalId:
        null

    }

  };

}
// ==========================================
// CONFIRMAR SUSCRIPCIÓN COMERCIAL
// ==========================================
//
// Mercado Pago devuelve:
// ?preapproval_id=XXXXXXXX
//
// TopoPro consulta directamente a Mercado Pago.
// El frontend NO decide si la suscripción está activa.
//

async function confirmarSuscripcionComercial(
  usuarioId,
  {
    preapprovalId
  }
) {

  const idUsuario =
    Number(usuarioId);


  // ==========================================
  // VALIDAR USUARIO
  // ==========================================

  if (
    !Number.isInteger(idUsuario) ||
    idUsuario <= 0
  ) {

    const error = new Error(
      'El ID del usuario no es válido.'
    );

    error.codigo =
      'USUARIO_ID_INVALIDO';

    error.estadoHttp = 400;

    throw error;
  }


  // ==========================================
  // VALIDAR PREAPPROVAL
  // ==========================================

  if (!preapprovalId) {

    const error = new Error(
      'El ID de suscripción de Mercado Pago es obligatorio.'
    );

    error.codigo =
      'PREAPPROVAL_ID_REQUERIDO';

    error.estadoHttp = 400;

    throw error;
  }


  // ==========================================
  // BUSCAR USUARIO
  // ==========================================

  const usuario =
    await prisma.usuario.findUnique({

      where: {
        id: idUsuario
      },

      select: {
        id: true,
        correo: true
      }

    });


  if (!usuario) {

    const error = new Error(
      'Usuario no encontrado.'
    );

    error.codigo =
      'USUARIO_NO_ENCONTRADO';

    error.estadoHttp = 404;

    throw error;
  }


  // ==========================================
  // CONSULTAR MERCADO PAGO
  // ==========================================

  console.log(
    '========== CONFIRMANDO SUSCRIPCIÓN =========='
  );

  console.log(
    'USUARIO:',
    idUsuario
  );

  console.log(
    'PREAPPROVAL ID:',
    String(preapprovalId)
  );


  const mercadoPago =
    await obtenerSuscripcionMercadoPago(
      String(preapprovalId)
    );


  console.log(
    'ESTADO MERCADO PAGO:',
    mercadoPago.status
  );


  // ==========================================
  // VALIDAR ESTADO
  // ==========================================

  const estadoMP =
    String(
      mercadoPago.status || ''
    ).toLowerCase();


  if (estadoMP !== 'authorized') {

    const error = new Error(
      `La suscripción de Mercado Pago no está autorizada. Estado actual: ${mercadoPago.status || 'desconocido'}`
    );

    error.codigo =
      'SUSCRIPCION_MP_NO_AUTORIZADA';

    error.estadoHttp = 400;

    throw error;
  }


  // ==========================================
  // IDENTIFICAR PLAN
  // ==========================================

  const planMercadoPagoId =
    String(
      mercadoPago.preapproval_plan_id || ''
    );


  let codigoPlan = null;


  if (
    planMercadoPagoId ===
    String(
      process.env.MERCADOPAGO_PLAN_PROFESSIONAL_ID || ''
    )
  ) {

    codigoPlan =
      'PROFESSIONAL';

  } else if (
    planMercadoPagoId ===
    String(
      process.env.MERCADOPAGO_PLAN_COMPANY_ID || ''
    )
  ) {

    codigoPlan =
      'COMPANY';

  }


  if (!codigoPlan) {

    const error = new Error(
      'La suscripción de Mercado Pago corresponde a un plan no reconocido por TopoPro.'
    );

    error.codigo =
      'PLAN_MERCADOPAGO_NO_RECONOCIDO';

    error.estadoHttp = 400;

    throw error;
  }


  console.log(
    'PLAN MERCADO PAGO:',
    planMercadoPagoId
  );

  console.log(
    'PLAN TOPOPRO:',
    codigoPlan
  );


  // ==========================================
  // BUSCAR PLAN TOPOPRO
  // ==========================================

  const plan =
    await prisma.plan.findUnique({

      where: {
        codigo: codigoPlan
      }

    });


  if (!plan || !plan.activo) {

    const error = new Error(
      'El plan correspondiente no está disponible en TopoPro.'
    );

    error.codigo =
      'PLAN_TOPOPRO_NO_DISPONIBLE';

    error.estadoHttp = 404;

    throw error;
  }

  // ==========================================
  // BUSCAR SUSCRIPCIÓN DEL USUARIO
  // ==========================================

  const suscripcionActual =
    await prisma.suscripcion.findUnique({

      where: {
        usuarioId: idUsuario
      }

    });


  if (!suscripcionActual) {

    const error = new Error(
      'El usuario no tiene una suscripción pendiente en TopoPro.'
    );

    error.codigo =
      'SUSCRIPCION_TOPOPRO_NO_ENCONTRADA';

    error.estadoHttp = 404;

    throw error;
  }


  // ==========================================
  // VALIDAR PROPIEDAD DE LA SUSCRIPCION
  // ==========================================

  const usadaPorOtroUsuario =
    await prisma.suscripcion.findFirst({
      where: {
        proveedorSuscripcionId: String(preapprovalId),
        usuarioId: { not: idUsuario }
      },
      select: { id: true }
    });

  if (usadaPorOtroUsuario) {
    const error = new Error(
      'Esta suscripcion de Mercado Pago ya esta asociada a otra cuenta.'
    );
    error.codigo = 'SUSCRIPCION_MP_YA_ASOCIADA';
    error.estadoHttp = 409;
    throw error;
  }

  const esLaMismaSuscripcion =
    suscripcionActual.proveedorSuscripcionId === String(preapprovalId);

  if (
    suscripcionActual.estado !== ESTADO_PENDIENTE &&
    !esLaMismaSuscripcion
  ) {
    const error = new Error(
      'Primero debes iniciar el proceso de suscripcion desde TopoPro.'
    );
    error.codigo = 'SUSCRIPCION_SIN_CHECKOUT';
    error.estadoHttp = 409;
    throw error;
  }

  // ==========================================
  // ACTUALIZAR SUSCRIPCIÓN
  // ==========================================

  const suscripcionActualizada =
    await prisma.suscripcion.update({

      where: {
        usuarioId: idUsuario
      },

      data: {

        planId:
          plan.id,

        estado:
          ESTADO_ACTIVA,

        proveedor:
          'MERCADOPAGO',

        proveedorClienteId:
          mercadoPago.payer_id
            ? String(
                mercadoPago.payer_id
              )
            : suscripcionActual.proveedorClienteId,

        proveedorSuscripcionId:
          String(
            mercadoPago.id
          ),

        fechaInicio:
          mercadoPago.auto_recurring &&
          mercadoPago.auto_recurring.start_date
            ? new Date(
                mercadoPago.auto_recurring.start_date
              )
            : suscripcionActual.fechaInicio,

        fechaFin:
          null

      },

      include: {
        plan: true
      }

    });


  // ==========================================
  // RESPUESTA
  // ==========================================

  console.log(
    'SUSCRIPCIÓN ACTIVADA EN TOPOPRO:',
    suscripcionActualizada.id
  );


  return {

    ok: true,

    suscripcion: suscripcionActualizada,

    mercadoPago: {

      id:
        mercadoPago.id
          ? String(
              mercadoPago.id
            )
          : null,

      status:
        mercadoPago.status ||
        null,

      payerId:
        mercadoPago.payer_id
          ? Number(
              mercadoPago.payer_id
            )
          : null,

      planId:
        mercadoPago.preapproval_plan_id
          ? String(
              mercadoPago.preapproval_plan_id
            )
          : null,

      monto:
        mercadoPago.auto_recurring
          ? mercadoPago.auto_recurring.transaction_amount
          : null,

      moneda:
        mercadoPago.auto_recurring
          ? mercadoPago.auto_recurring.currency_id
          : null,

      proximoCobro:
        mercadoPago.next_payment_date ||
        null

    }

  };

}


// ==========================================
// PROCESAR WEBHOOK MERCADO PAGO
// ==========================================

async function procesarWebhookMercadoPago({
  tipo,
  preapprovalId
}) {

  console.log(
    '========== PROCESANDO WEBHOOK MERCADO PAGO =========='
  );

  console.log(
    'TIPO:',
    tipo
  );

  console.log(
    'PREAPPROVAL ID:',
    preapprovalId
  );


  // ==========================================
  // VALIDAR ID
  // ==========================================

  if (!preapprovalId) {

    console.log(
      'WEBHOOK SIN DATA.ID'
    );

    return {

      procesado: false,

      motivo:
        'DATA_ID_NO_ENCONTRADO'

    };

  }


  // ==========================================
  // CONSULTAR SUSCRIPCIÓN EN MERCADO PAGO
  // ==========================================

  let mercadoPago;

  try {

    mercadoPago =
      await obtenerSuscripcionMercadoPago(
        String(preapprovalId)
      );

  } catch (error) {

    console.error(
      'ERROR CONSULTANDO SUSCRIPCIÓN EN MERCADO PAGO:',
      error
    );

    return {

      procesado: false,

      motivo:
        'SUSCRIPCION_MERCADOPAGO_NO_ENCONTRADA',

      preapprovalId:
        String(preapprovalId)

    };

  }


  // ==========================================
  // ESTADO MERCADO PAGO
  // ==========================================

  const estadoMP =
    String(
      mercadoPago.status || ''
    ).toLowerCase();


  console.log(
    'ESTADO MERCADO PAGO:',
    estadoMP
  );


  // ==========================================
  // BUSCAR SUSCRIPCIÓN TOPOPRO
  // ==========================================

  const suscripcion =
    await prisma.suscripcion.findFirst({

      where: {

        proveedor:
          'MERCADOPAGO',

        proveedorSuscripcionId:
          String(preapprovalId)

      }

    });


  if (!suscripcion) {

    console.log(
      'SUSCRIPCIÓN NO ENCONTRADA EN TOPOPRO:',
      String(preapprovalId)
    );

    return {

      procesado: false,

      motivo:
        'SUSCRIPCION_NO_ENCONTRADA'

    };

  }


  // ==========================================
  // DETERMINAR ESTADO TOPOPRO
  // ==========================================

  let nuevoEstado;


  if (
    estadoMP === 'authorized'
  ) {

    nuevoEstado =
      ESTADO_ACTIVA;

  } else if (
    estadoMP === 'paused'
  ) {

    nuevoEstado =
      ESTADO_PAUSADA;

  } else if (estadoMP === 'cancelled') {

    nuevoEstado =
      ESTADO_CANCELADA;

  } else {

    console.log(
      'ESTADO MERCADO PAGO SIN CAMBIO EN TOPOPRO:',
      estadoMP
    );

    return {
      procesado: false,
      motivo: 'ESTADO_MP_SIN_CAMBIO',
      estadoMercadoPago: estadoMP
    };

  }


  // ==========================================
  // ACTUALIZAR SUSCRIPCIÓN
  // ==========================================

  const suscripcionActualizada =
    await prisma.suscripcion.update({

      where: {

        id:
          suscripcion.id

      },

      data: {

        estado:
          nuevoEstado

      },

      include: {

        plan: true

      }

    });


  console.log(
    'SUSCRIPCIÓN ACTUALIZADA:',
    {

      id:
        suscripcionActualizada.id,

      estado:
        suscripcionActualizada.estado

    }
  );


  // ==========================================
  // RESPUESTA
  // ==========================================

  return {

    procesado: true,

    motivo:
      'SUSCRIPCION_ACTUALIZADA',

    suscripcion:
      suscripcionActualizada,

    mercadoPago: {

      id:
        mercadoPago.id
          ? String(
              mercadoPago.id
            )
          : null,

      status:
        mercadoPago.status ||
        null

    }

  };

}


// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {

  obtenerContextoComercial,

  verificarPuedeCrearProyecto,

  verificarPuedeAgregarPunto,

  verificarPuedeAdministrarEquipos,

  verificarPuedeExportar,

  crearSuscripcionComercial,

  confirmarSuscripcionComercial,

  procesarWebhookMercadoPago

};
