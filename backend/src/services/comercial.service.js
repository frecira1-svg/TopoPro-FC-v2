const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const { crearSuscripcion } = require('./mercadopago.service');

const CODIGO_PLAN_FREE = 'FREE';
const ESTADO_ACTIVA = 'ACTIVA';

async function obtenerPlanFree() {
  const plan = await prisma.plan.findUnique({
    where: {
      codigo: CODIGO_PLAN_FREE
    }
  });

  if (!plan) {
    throw new Error('El plan FREE no está configurado en la base de datos');
  }

  return plan;
}

/**
 * Obtiene el contexto comercial actual de un usuario.
 *
 * Si el usuario no tiene suscripción:
 * - Se considera FREE.
 *
 * Si la suscripción está vencida/cancelada:
 * - También se considera FREE.
 *
 * ADMIN:
 * - No queda limitado por las reglas comerciales.
 */
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

  // El administrador tiene acceso completo.
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

  if (suscripcion && suscripcion.estado === ESTADO_ACTIVA) {
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
    puedeAdministrarEquipos: plan.codigo !== CODIGO_PLAN_FREE
  };
}

/**
 * Verifica si el usuario puede crear otro proyecto.
 *
 * FREE:
 * - Solo puede tener 1 proyecto.
 *
 * PROFESSIONAL / COMPANY:
 * - Se utiliza maxProyectos cuando tenga un límite definido.
 */
async function verificarPuedeCrearProyecto(usuarioId) {
  const contexto = await obtenerContextoComercial(usuarioId);

  if (contexto.esAdmin) {
    return contexto;
  }

  const cantidadProyectos = await prisma.proyecto.count({
    where: {
      usuarioId
    }
  });

  const limite = contexto.plan.maxProyectos;

  if (limite !== null && cantidadProyectos >= limite) {
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

/**
 * Verifica si se puede agregar un punto a un proyecto.
 *
 * FREE:
 * - Máximo 500 puntos por proyecto.
 *
 * PROFESSIONAL / COMPANY:
 * - Se respeta maxPuntosProyecto si está definido.
 */
async function verificarPuedeAgregarPunto(
  usuarioId,
  proyectoId,
  cantidadAAgregar = 1
) {
  const contexto = await obtenerContextoComercial(usuarioId);

  if (contexto.esAdmin) {
    return contexto;
  }

  const proyecto = await prisma.proyecto.findFirst({
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

  const limite = contexto.plan.maxPuntosProyecto;

  // null significa que el plan no tiene límite configurado.
  if (limite === null) {
    return contexto;
  }

  const cantidadActual = await prisma.puntoTopografico.count({
    where: {
      proyectoId
    }
  });

  if (cantidadActual + cantidadAAgregar > limite) {
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

/**
 * Verifica si el usuario puede administrar equipos.
 *
 * FREE:
 * - Puede consultar equipos.
 * - No puede crear, editar ni eliminar.
 *
 * PROFESSIONAL / COMPANY:
 * - Puede administrar equipos.
 *
 * ADMIN:
 * - Acceso completo.
 */
async function verificarPuedeAdministrarEquipos(usuarioId) {
  const contexto = await obtenerContextoComercial(usuarioId);

  if (contexto.esAdmin || contexto.puedeAdministrarEquipos) {
    return contexto;
  }

  const error = new Error(
    'La administración de equipos requiere un plan Profesional o Empresa.'
  );

  error.codigo = 'EQUIPOS_REQUIEREN_PLAN';
  error.estadoHttp = 403;

  throw error;
}

/**
 * Verifica si el usuario puede exportar/entregar un proyecto.
 *
 * FREE:
 * - Puede trabajar y visualizar.
 * - No puede realizar la exportación/entrega final.
 */
async function verificarPuedeExportar(usuarioId) {
  const contexto = await obtenerContextoComercial(usuarioId);

  if (contexto.esAdmin || contexto.puedeExportar) {
    return contexto;
  }

  const error = new Error(
    'La exportación y entrega final requieren un plan Profesional o Empresa.'
  );

  error.codigo = 'EXPORTACION_REQUIERE_PLAN';
  error.estadoHttp = 403;

  throw error;
}

/**
 * Crea una suscripción comercial en Mercado Pago
 * y la registra en TopoPro.
 *
 * El frontend solo proporciona:
 * - código del plan
 * - cardTokenId generado por Mercado Pago.js
 *
 * El backend determina:
 * - usuario
 * - correo
 * - plan TopoPro
 * - referencia externa
 */
async function crearSuscripcionComercial(
  usuarioId,
  {
    codigoPlan,
    cardTokenId
  }
) {
  const codigo = String(codigoPlan || '')
    .trim()
    .toUpperCase();

  if (!['PROFESSIONAL', 'COMPANY'].includes(codigo)) {
    const error = new Error(
      'Solo están disponibles los planes Profesional y Empresa.'
    );

    error.codigo = 'PLAN_COMERCIAL_INVALIDO';
    error.estadoHttp = 400;

    throw error;
  }

  if (!cardTokenId) {
    const error = new Error(
      'El token de tarjeta es obligatorio.'
    );

    error.codigo = 'CARD_TOKEN_REQUERIDO';
    error.estadoHttp = 400;

    throw error;
  }

  const usuario = await prisma.usuario.findUnique({
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

  if (usuario.rol === 'ADMIN') {
    const error = new Error(
      'El administrador no necesita una suscripción comercial.'
    );

    error.codigo = 'ADMIN_SIN_SUSCRIPCION';
    error.estadoHttp = 400;

    throw error;
  }

  const plan = await prisma.plan.findUnique({
    where: {
      codigo: codigo
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

  /*
   * Registramos primero el intento como PENDIENTE.
   * Así no activamos ningún plan antes de que
   * Mercado Pago confirme la autorización.
   */
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

  const externalReference =
    `TOPOPRO-${usuario.id}-${Date.now()}`;

  try {
    const respuestaMercadoPago =
      await crearSuscripcion({
        codigoPlan: codigo,
        payerEmail: usuario.correo,
        externalReference,
        cardTokenId
      });

    // =========================================================
    // DEBUG: RESPUESTA REAL DE MERCADO PAGO
    // =========================================================
    console.log(
      '========== RESPUESTA MERCADO PAGO =========='
    );

    console.log(
      'MP ID:',
      respuestaMercadoPago?.id
    );

    console.log(
      'MP STATUS:',
      respuestaMercadoPago?.status
    );

    console.log(
      'MP EXTERNAL REFERENCE:',
      respuestaMercadoPago?.external_reference
    );

    console.log(
      'MP RESPONSE COMPLETA:',
      JSON.stringify(
        respuestaMercadoPago,
        null,
        2
      )
    );

    console.log(
      '============================================'
    );

    const estadoMercadoPago =
      String(
        respuestaMercadoPago.status || ''
      ).toLowerCase();

    const estadoTopopro =
      estadoMercadoPago === 'authorized'
        ? 'ACTIVA'
        : 'PENDIENTE';

    const proveedorSuscripcionId =
      respuestaMercadoPago?.id
        ? String(
            respuestaMercadoPago.id
          )
        : null;

    // =========================================================
    // VALIDACIÓN: MERCADO PAGO DEBE DEVOLVER ID
    // =========================================================
    if (!proveedorSuscripcionId) {
      const error = new Error(
        'Mercado Pago no devolvió el ID de la suscripción.'
      );

      error.codigo =
        'MERCADOPAGO_ID_SUSCRIPCION_AUSENTE';

      error.estadoHttp = 502;

      console.error(
        'ERROR: Mercado Pago creó la suscripción pero no devolvió un ID.'
      );

      throw error;
    }

    const suscripcion =
      await prisma.suscripcion.update({
        where: {
          usuarioId: usuario.id
        },

        data: {
          planId: plan.id,
          estado: estadoTopopro,
          proveedor: 'MERCADOPAGO',

          proveedorSuscripcionId,

          fechaInicio:
            new Date()
        },

        include: {
          plan: true
        }
      });

    // =========================================================
    // DEBUG: CONFIRMACIÓN DE SUSCRIPCIÓN TOPOPRO
    // =========================================================
    console.log(
      '========== SUSCRIPCIÓN TOPOPRO ACTUALIZADA =========='
    );

    console.log(
      'USUARIO:',
      usuario.id
    );

    console.log(
      'PLAN:',
      plan.codigo
    );

    console.log(
      'PROVEEDOR:',
      suscripcion.proveedor
    );

    console.log(
      'PROVEEDOR SUSCRIPCIÓN ID:',
      suscripcion.proveedorSuscripcionId
    );

    console.log(
      'ESTADO:',
      suscripcion.estado
    );

    console.log(
      'EXTERNAL REFERENCE:',
      externalReference
    );

    console.log(
      '===================================================='
    );

    return {
      suscripcion,

      mercadoPago: {
        id:
          respuestaMercadoPago.id
            ? String(
                respuestaMercadoPago.id
              )
            : null,

        status:
          respuestaMercadoPago.status ||
          null,

        externalReference
      }
    };

  } catch (error) {

    /*
     * Si Mercado Pago rechaza la creación,
     * dejamos la suscripción local en PENDIENTE
     * para no activar el acceso comercial.
     */
    console.error(
      'ERROR CREANDO SUSCRIPCIÓN MERCADO PAGO:',
      error
    );

    throw error;
  }
}

module.exports = {
  obtenerContextoComercial,
  verificarPuedeCrearProyecto,
  verificarPuedeAgregarPunto,
  verificarPuedeAdministrarEquipos,
  verificarPuedeExportar,
  crearSuscripcionComercial
};