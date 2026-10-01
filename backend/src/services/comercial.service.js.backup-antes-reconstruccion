const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const {
  obtenerSuscripcionMercadoPago
} = require('./mercadopago.service');

const CODIGO_PLAN_FREE = 'FREE';
const ESTADO_ACTIVA = 'ACTIVA';


// ==========================================
// PLAN FREE
// ==========================================

async function obtenerPlanFree() {

  const plan = await prisma.plan.findUnique({
    where: {
      codigo: CODIGO_PLAN_FREE
    }
  });

  if (!plan) {
    throw new Error(
      'El plan FREE no está configurado en la base de datos'
    );
  }

  return plan;
}


// ==========================================
// CONTEXTO COMERCIAL
// ==========================================

async function obtenerContextoComercial(usuarioId) {

  const usuario = await prisma.usuario.findUnique({
    where: {
      id: usuarioId
    },
    select: {
      id: true,
      rol: true,
      suscripcion: {
        include: {
          plan: true
        }
      }
    }
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  // ADMIN
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

  let plan = null;
  let suscripcion = usuario.suscripcion || null;

  if (
    suscripcion &&
    suscripcion.estado === ESTADO_ACTIVA
  ) {

    plan = suscripcion.plan;

  } else {

    plan = await obtenerPlanFree();
    suscripcion = null;
  }

  return {
    usuarioId: usuario.id,
    rol: usuario.rol,
    esAdmin: false,
    plan,
    suscripcion,
    esFree: plan.codigo === CODIGO_PLAN_FREE,
    puedeExportar: Boolean(plan.permiteExportacion),
    puedeCrearProyecto: true,
    puedeAdministrarEquipos:
      plan.codigo !== CODIGO_PLAN_FREE
  };
}


// ==========================================
// VERIFICAR PROYECTOS
// ==========================================

async function verificarPuedeCrearProyecto(usuarioId) {

  const contexto =
    await obtenerContextoComercial(usuarioId);

  if (contexto.esAdmin) {
    return contexto;
  }

  const cantidadProyectos =
    await prisma.proyecto.count({
      where: {
        usuarioId
      }
    });

  const limite =
    contexto.plan.maxProyectos;

  if (
    limite !== null &&
    cantidadProyectos >= limite
  ) {

    const error = new Error(
      contexto.esFree
        ? 'Tu primer proyecto gratuito ya fue utilizado. Activa un plan para crear nuevos proyectos.'
        : 'Has alcanzado el límite de proyectos de tu plan.'
    );

    error.codigo = 'LIMITE_PROYECTOS';
    error.estadoHttp = 403;

    throw error;
  }

  return {
    ...contexto,
    cantidadProyectos,
    limiteProyectos: limite
  };
}


// ==========================================
// VERIFICAR PUNTOS
// ==========================================

async function verificarPuedeAgregarPunto(
  usuarioId,
  proyectoId,
  cantidadAAgregar = 1
) {

  const contexto =
    await obtenerContextoComercial(usuarioId);

  if (contexto.esAdmin) {
    return contexto;
  }

  const proyecto =
    await prisma.proyecto.findFirst({
      where: {
        id: proyectoId,
        usuarioId
      },
      select: {
        id: true
      }
    });

  if (!proyecto) {

    const error = new Error(
      'No tienes autorización para agregar puntos a este proyecto.'
    );

    error.codigo = 'PROYECTO_NO_AUTORIZADO';
    error.estadoHttp = 403;

    throw error;
  }

  const limite =
    contexto.plan.maxPuntosProyecto;

  if (limite === null) {
    return contexto;
  }

  const cantidadActual =
    await prisma.puntoTopografico.count({
      where: {
        proyectoId
      }
    });

  if (
    cantidadActual + cantidadAAgregar >
    limite
  ) {

    const error = new Error(
      contexto.esFree
        ? `El proyecto gratuito permite máximo ${limite} puntos. Actualmente tienes ${cantidadActual}.`
        : `Has alcanzado el límite de ${limite} puntos permitido por tu plan.`
    );

    error.codigo = 'LIMITE_PUNTOS';
    error.estadoHttp = 403;
    error.cantidadActual = cantidadActual;
    error.limite = limite;

    throw error;
  }

  return {
    ...contexto,
    cantidadPuntos: cantidadActual,
    limitePuntos: limite
  };
}


// ==========================================
// VERIFICAR EQUIPOS
// ==========================================

async function verificarPuedeAdministrarEquipos(usuarioId) {

  const contexto =
    await obtenerContextoComercial(usuarioId);

  if (
    contexto.esAdmin ||
    contexto.puedeAdministrarEquipos
  ) {
    return contexto;
  }

  const error = new Error(
    'La administración de equipos requiere un plan Profesional o Empresa.'
  );

  error.codigo = 'EQUIPOS_REQUIEREN_PLAN';
  error.estadoHttp = 403;

  throw error;
}


// ==========================================
// VERIFICAR EXPORTACIÓN
// ==========================================

async function verificarPuedeExportar(usuarioId) {

  const contexto =
    await obtenerContextoComercial(usuarioId);

  if (
    contexto.esAdmin ||
    contexto.puedeExportar
  ) {
    return contexto;
  }

  const error = new Error(
    'La exportación y entrega final requieren un plan Profesional o Empresa.'
  );

  error.codigo = 'EXPORTACION_REQUIERE_PLAN';
  error.estadoHttp = 403;

  throw error;
}


// ==========================================
// CREAR SUSCRIPCIÓN COMERCIAL
// ==========================================
//
// IMPORTANTE:
//
// Ya NO creamos directamente el preapproval
// con cardTokenId.
//
// En su lugar:
//
// 1. Creamos/actualizamos la suscripción local
//    como PENDIENTE.
// 2. Devolvemos el checkout del plan de Mercado Pago.
// 3. El comprador inicia sesión.
// 4. Mercado Pago crea la suscripción.
// 5. Mercado Pago devuelve preapproval_id.
// 6. TopoPro confirma ese ID.
//
// ==========================================

async function crearSuscripcionComercial(
  usuarioId,
  {
    codigoPlan
  }
) {

  const codigo = String(codigoPlan || '')
    .trim()
    .toUpperCase();


  // ==========================================
  // VALIDAR PLAN
  // ==========================================

  if (
    !['PROFESSIONAL', 'COMPANY'].includes(codigo)
  ) {

    const error = new Error(
      'Solo están disponibles los planes Profesional y Empresa.'
    );

    error.codigo = 'PLAN_COMERCIAL_INVALIDO';
    error.estadoHttp = 400;

    throw error;
  }


  // ==========================================
  // OBTENER USUARIO
  // ==========================================

  const usuario =
    await prisma.usuario.findUnique({

      where: {
        id: Number(usuarioId)
      },

      select: {
        id: true,
        correo: true,
        rol: true,
        suscripcion: true
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
  // ADMIN
  // ==========================================

  if (usuario.rol === 'ADMIN') {

    const error = new Error(
      'El administrador no necesita una suscripción comercial.'
    );

    error.codigo = 'ADMIN_SIN_SUSCRIPCION';
    error.estadoHttp = 400;

    throw error;
  }


  // ==========================================
  // OBTENER PLAN TOPOPRO
  // ==========================================

  const plan =
    await prisma.plan.findUnique({

      where: {
        codigo
      }

    });


  if (!plan || !plan.activo) {

    const error = new Error(
      'El plan comercial no está disponible.'
    );

    error.codigo = 'PLAN_NO_DISPONIBLE';
    error.estadoHttp = 404;

    throw error;
  }


  // ==========================================
  // VERIFICAR SUSCRIPCIÓN EXISTENTE
  // ==========================================

  const suscripcionActual =
    usuario.suscripcion || null;


  if (
    suscripcionActual &&
    (
      suscripcionActual.estado === 'ACTIVA' ||
      (
        suscripcionActual.estado === 'PENDIENTE' &&
        suscripcionActual.proveedorSuscripcionId
      )
    )
  ) {

    const error = new Error(
      'Ya tienes una suscripción en proceso o activa.'
    );

    error.codigo = 'SUSCRIPCION_EXISTENTE';
    error.estadoHttp = 409;

    throw error;
  }


  // ==========================================
  // PLAN MERCADO PAGO
  // ==========================================

  let planMercadoPagoId = null;

  if (codigo === 'PROFESSIONAL') {

    planMercadoPagoId =
      process.env.MERCADOPAGO_PLAN_PROFESSIONAL_ID;

  }

  if (codigo === 'COMPANY') {

    planMercadoPagoId =
      process.env.MERCADOPAGO_PLAN_COMPANY_ID;

  }


  if (!planMercadoPagoId) {

    const error = new Error(
      'El plan de Mercado Pago no está configurado.'
    );

    error.codigo =
      'PLAN_MERCADOPAGO_NO_CONFIGURADO';

    error.estadoHttp = 500;

    throw error;
  }


  // ==========================================
  // REGISTRAR INTENTO PENDIENTE
  // ==========================================

  await prisma.suscripcion.upsert({

    where: {
      usuarioId: usuario.id
    },

    create: {

      usuarioId: usuario.id,
      planId: plan.id,
      estado: 'PENDIENTE',
      proveedor: 'MERCADOPAGO',
      fechaInicio: new Date()

    },

    update: {

      planId: plan.id,
      estado: 'PENDIENTE',
      proveedor: 'MERCADOPAGO',
      proveedorClienteId: null,
      proveedorSuscripcionId: null,
      fechaInicio: new Date(),
      fechaFin: null

    }

  });


  // ==========================================
  // CHECKOUT DEL PLAN MERCADO PAGO
  // ==========================================

  const initPoint =
    `https://www.mercadopago.com.co/subscriptions/checkout?preapproval_plan_id=${encodeURIComponent(planMercadoPagoId)}`;


  console.log(
    'CHECKOUT MERCADO PAGO:',
    initPoint
  );


  return {

    pendiente: true,

    codigoPlan: codigo,

    plan: {
      id: plan.id,
      codigo: plan.codigo,
      nombre: plan.nombre
    },

    mercadoPago: {

      planId: planMercadoPagoId,

      initPoint

    }

  };
}


// ==========================================
// CONFIRMAR SUSCRIPCIÓN COMERCIAL
// ==========================================
//
// Mercado Pago regresa:
//
// ?preapproval_id=XXXXXXXX
//
// TopoPro consulta directamente a Mercado Pago
// y NO confía únicamente en el frontend.
//
// ==========================================

async function confirmarSuscripcionComercial(
  usuarioId,
  {
    preapprovalId
  }
) {

  const idUsuario =
    Number(usuarioId);

// ==========================================
// PROCESAR WEBHOOK MERCADO PAGO
// ==========================================

async function procesarWebhookMercadoPago({
  tipo,
  preapprovalId
}) {

  console.log(
    'PROCESANDO WEBHOOK MERCADO PAGO:',
    {
      tipo,
      preapprovalId
    }
  );


  // ==========================================
  // VALIDAR ID
  // ==========================================

  if (!preapprovalId) {

    console.log(
      'WEBHOOK SIN PREAPPROVAL_ID'
    );

    return {
      procesado: false,
      motivo: 'PREAPPROVAL_ID_NO_ENCONTRADO'
    };

  }


  // ==========================================
  // CONSULTAR MERCADO PAGO
  // ==========================================

  const mercadoPago =
    await obtenerSuscripcionMercadoPago(
      preapprovalId
    );


  console.log(
    'ESTADO MERCADO PAGO:',
    mercadoPago.status
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
          preapprovalId

      }

    });


  if (!suscripcion) {

    console.log(
      'SUSCRIPCIÓN NO ENCONTRADA EN TOPOPRO:',
      preapprovalId
    );

    return {

      procesado: false,

      motivo:
        'SUSCRIPCION_NO_ENCONTRADA'

    };

  }


  // ==========================================
  // MAPEAR ESTADO
  // ==========================================

  const estadoMP =
    String(
      mercadoPago.status || ''
    ).toLowerCase();


  let estadoTopoPro;


  switch (estadoMP) {

    case 'authorized':

      estadoTopoPro =
        'ACTIVA';

      break;


    case 'paused':

      estadoTopoPro =
        'PENDIENTE';

      break;


    case 'cancelled':

      estadoTopoPro =
        'CANCELADA';

      break;


    default:

      console.log(
        'ESTADO MERCADO PAGO NO MANEJADO:',
        estadoMP
      );

      return {

        procesado: false,

        motivo:
          'ESTADO_NO_MANEJADO',

        estadoMercadoPago:
          estadoMP

      };

  }


  // ==========================================
  // ACTUALIZAR TOPOPRO
  // ==========================================

  const actualizada =
    await prisma.suscripcion.update({

      where: {

        id:
          suscripcion.id

      },

      data: {

        estado:
          estadoTopoPro,

        proveedor:
          'MERCADOPAGO',

        proveedorClienteId:
          mercadoPago.payer_id
            ? String(
                mercadoPago.payer_id
              )
            : suscripcion.proveedorClienteId,

        proveedorSuscripcionId:
          preapprovalId,

        fechaFin:
          estadoTopoPro === 'CANCELADA'
            ? new Date()
            : suscripcion.fechaFin

      }

    });


  console.log(
    'SUSCRIPCIÓN TOPOPro ACTUALIZADA:',
    {

      id:
        actualizada.id,

      usuarioId:
        actualizada.usuarioId,

      estado:
        actualizada.estado

    }
  );


  return {

    procesado: true,

    suscripcionId:
      actualizada.id,

    usuarioId:
      actualizada.usuarioId,

    estado:
      actualizada.estado

  };

}




  // ==========================================
  // VALIDAR ID
  // ==========================================

  if (!preapprovalId) {

    const error = new Error(
      'El preapproval_id de Mercado Pago es obligatorio.'
    );

    error.codigo =
      'PREAPPROVAL_ID_REQUERIDO';

    error.estadoHttp = 400;

    throw error;
  }


  const usuario =
    await prisma.usuario.findUnique({

      where: {
        id: idUsuario
      },

      select: {
        id: true,
        rol: true,
        correo: true,
        suscripcion: true
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

  const mercadoPago =
    await obtenerSuscripcionMercadoPago(
      preapprovalId
    );


  console.log(
    'SUSCRIPCIÓN MERCADO PAGO:',
    JSON.stringify(
      mercadoPago,
      null,
      2
    )
  );


  // ==========================================
  // VALIDAR ESTADO
  // ==========================================

  const estadoMP =
    String(
      mercadoPago.status || ''
    ).toLowerCase();


  if (
    !['authorized', 'paused'].includes(
      estadoMP
    )
  ) {

    const error = new Error(
      `La suscripción de Mercado Pago no está autorizada. Estado actual: ${mercadoPago.status || 'desconocido'}`
    );

    error.codigo =
      'SUSCRIPCION_MP_NO_AUTORIZADA';

    error.estadoHttp = 400;

    throw error;
  }


  // ==========================================
  // DETERMINAR PLAN
  // ==========================================

  const planMercadoPagoId =
    String(
      mercadoPago.preapproval_plan_id || ''
    );


  let codigoPlan = null;


  if (
    planMercadoPagoId ===
    process.env.MERCADOPAGO_PLAN_PROFESSIONAL_ID
  ) {

    codigoPlan = 'PROFESSIONAL';

  } else if (
    planMercadoPagoId ===
    process.env.MERCADOPAGO_PLAN_COMPANY_ID
  ) {

    codigoPlan = 'COMPANY';

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


  // ==========================================
  // OBTENER PLAN TOPOPRO
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
  // VALIDAR COLLECTOR
  // ==========================================

  const collectorEsperado =
    process.env.MERCADOPAGO_TEST_MODE === 'true'
      ? process.env.MERCADOPAGO_TEST_SELLER_ID
      : null;


  if (
    collectorEsperado &&
    mercadoPago.collector_id &&
    String(
      mercadoPago.collector_id
    ) !== String(
      collectorEsperado
    )
  ) {

    const error = new Error(
      'La suscripción de Mercado Pago no pertenece al vendedor de prueba configurado.'
    );

    error.codigo =
      'COLLECTOR_MERCADOPAGO_INVALIDO';

    error.estadoHttp = 400;

    throw error;
  }


  // ==========================================
  // VALIDAR PAYER
  // ==========================================

  if (
    mercadoPago.payer_id &&
    Number(mercadoPago.payer_id) <= 0
  ) {

    const error = new Error(
      'Mercado Pago devolvió un payer_id inválido.'
    );

    error.codigo =
      'PAYER_MERCADOPAGO_INVALIDO';

    error.estadoHttp = 400;

    throw error;
  }


  // ==========================================
  // GUARDAR SUSCRIPCIÓN
  // ==========================================

  const suscripcion =
    await prisma.suscripcion.upsert({

      where: {
        usuarioId: usuario.id
      },

      create: {

        usuarioId: usuario.id,

        planId: plan.id,

        estado: ESTADO_ACTIVA,

        proveedor: 'MERCADOPAGO',

        proveedorClienteId:
          mercadoPago.payer_id
            ? String(
                mercadoPago.payer_id
              )
            : null,

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
            : new Date(),

        fechaFin: null

      },

      update: {

        planId: plan.id,

        estado: ESTADO_ACTIVA,

        proveedor: 'MERCADOPAGO',

        proveedorClienteId:
          mercadoPago.payer_id
            ? String(
                mercadoPago.payer_id
              )
            : null,

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
            : new Date(),

        fechaFin: null

      },

      include: {
        plan: true
      }

    });


  // ==========================================
  // RESPUESTA
  // ==========================================

  return {

    ok: true,

    suscripcion,

    mercadoPago: {

      id:
        mercadoPago.id
          ? String(
              mercadoPago.id
            )
          : null,

      status:
        mercadoPago.status || null,

      payerId:
        mercadoPago.payer_id
          ? Number(
              mercadoPago.payer_id
            )
          : null,

      collectorId:
        mercadoPago.collector_id
          ? Number(
              mercadoPago.collector_id
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
        mercadoPago.next_payment_date || null

    }

  };
}

// ==========================================
// WEBHOOK MERCADO PAGO
// ==========================================

async function procesarWebhookMercadoPago({
  tipo,
  preapprovalId
}) {

  console.log(
    '========== PROCESANDO WEBHOOK MERCADO PAGO =========='
  );

  console.log(
    'Tipo:',
    tipo
  );

  console.log(
    'Preapproval ID:',
    preapprovalId
  );


  // ==========================================
  // VALIDAR ID
  // ==========================================

  if (!preapprovalId) {

    console.log(
      'WEBHOOK SIN PREAPPROVAL_ID'
    );

    return {
      procesado: false,
      motivo: 'PREAPPROVAL_ID_NO_ENCONTRADO'
    };

  }


  // ==========================================
  // CONSULTAR MERCADO PAGO
  // ==========================================

  const mercadoPago =
    await obtenerSuscripcionMercadoPago(
      preapprovalId
    );


  console.log(
    'ESTADO MERCADO PAGO:',
    mercadoPago.status
  );


  // ==========================================
  // BUSCAR SUSCRIPCIÓN EN TOPOPro
  // ==========================================

  const suscripcion =
    await prisma.suscripcion.findFirst({

      where: {

        proveedor:
          'MERCADOPAGO',

        proveedorSuscripcionId:
          preapprovalId

      }

    });


  if (!suscripcion) {

    console.log(
      'SUSCRIPCIÓN NO ENCONTRADA EN TOPOPro:',
      preapprovalId
    );

    return {

      procesado: false,

      motivo:
        'SUSCRIPCION_NO_ENCONTRADA'

    };

  }


  // ==========================================
  // MAPEAR ESTADO
  // ==========================================

  const estadoMP =
    String(
      mercadoPago.status || ''
    ).toLowerCase();


  let estadoTopoPro;


  switch (estadoMP) {

    case 'authorized':

      estadoTopoPro =
        'ACTIVA';

      break;


    case 'paused':

      estadoTopoPro =
        'PENDIENTE';

      break;


    case 'cancelled':

      estadoTopoPro =
        'CANCELADA';

      break;


    default:

      console.log(
        'ESTADO NO MANEJADO:',
        estadoMP
      );

      return {

        procesado: false,

        motivo:
          'ESTADO_NO_MANEJADO',

        estadoMercadoPago:
          estadoMP

      };

  }


  // ==========================================
  // ACTUALIZAR SUSCRIPCIÓN
  // ==========================================

  const actualizada =
    await prisma.suscripcion.update({

      where: {

        id:
          suscripcion.id

      },

      data: {

        estado:
          estadoTopoPro,

        proveedor:
          'MERCADOPAGO',

        proveedorClienteId:
          mercadoPago.payer_id
            ? String(
                mercadoPago.payer_id
              )
            : suscripcion.proveedorClienteId,

        proveedorSuscripcionId:
          preapprovalId,

        fechaFin:
          estadoTopoPro === 'CANCELADA'
            ? new Date()
            : suscripcion.fechaFin

      }

    });


  console.log(
    'SUSCRIPCIÓN ACTUALIZADA:',
    {

      id:
        actualizada.id,

      usuarioId:
        actualizada.usuarioId,

      estado:
        actualizada.estado

    }
  );


  return {

    procesado: true,

    suscripcionId:
      actualizada.id,

    usuarioId:
      actualizada.usuarioId,

    estado:
      actualizada.estado

  };

}

// ==========================================
// EXPORTS
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