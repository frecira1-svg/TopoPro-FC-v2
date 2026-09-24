const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

module.exports = {
  obtenerContextoComercial,
  verificarPuedeCrearProyecto,
  verificarPuedeAgregarPunto,
  verificarPuedeAdministrarEquipos,
  verificarPuedeExportar
};