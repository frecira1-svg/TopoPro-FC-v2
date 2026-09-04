const prisma = require('../lib/prisma');
const { enviarCorreoContacto } = require('./emailService');

function limpiar(valor, max = 5000) {
  return String(valor ?? '').trim().slice(0, max);
}

async function crearContacto({ remitenteId, destinatarioId, asunto, mensaje }) {
  const senderId = Number(remitenteId);
  const targetId = Number(destinatarioId);
  if (!Number.isInteger(senderId) || !Number.isInteger(targetId) || senderId <= 0 || targetId <= 0) {
    const e = new Error('Usuario no válido'); e.status = 400; throw e;
  }
  if (senderId === targetId) {
    const e = new Error('No puedes enviarte una solicitud de contacto a ti mismo'); e.status = 400; throw e;
  }
  const texto = limpiar(mensaje, 4000);
  if (!texto) { const e = new Error('El mensaje es obligatorio'); e.status = 400; throw e; }

  const [remitente, destinatario] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: senderId }, select: { id:true, nombre:true, apellido:true, correo:true, activo:true, emailVerificado:true } }),
    prisma.usuario.findUnique({ where: { id: targetId }, select: { id:true, nombre:true, apellido:true, correo:true, activo:true, emailVerificado:true } })
  ]);
  if (!remitente || !remitente.activo || !remitente.emailVerificado) { const e=new Error('Tu cuenta debe estar activa y verificada'); e.status=403; throw e; }
  if (!destinatario || !destinatario.activo) { const e=new Error('El profesional no está disponible'); e.status=404; throw e; }

  const nombreRemitente = `${remitente.nombre} ${remitente.apellido}`.trim();
  const nombreDestinatario = `${destinatario.nombre} ${destinatario.apellido}`.trim();
  const contacto = await prisma.contactoProfesional.create({
    data: { remitenteId: senderId, destinatarioId: targetId, asunto: limpiar(asunto, 180) || null, mensaje: texto, nombreContacto: nombreRemitente, correoContacto: remitente.correo }
  });

  let notificado = true;
  try {
    await enviarCorreoContacto({ destinatario: destinatario.correo, nombreDestinatario, nombreRemitente, correoRemitente: remitente.correo, asunto: limpiar(asunto,180), mensaje: texto });
  } catch (error) {
    notificado = false;
    console.error('Contacto guardado pero no se pudo notificar por correo:', error.message);
  }
  return { id: contacto.id, notificado };
}

async function listarRecibidos(usuarioId) {
  return prisma.contactoProfesional.findMany({ where: { destinatarioId: Number(usuarioId) }, orderBy: { createdAt: 'desc' }, select: { id:true, asunto:true, mensaje:true, nombreContacto:true, correoContacto:true, estado:true, createdAt:true, remitenteId:true } });
}

async function cambiarEstado(id, usuarioId, estado) {
  if (!['PENDIENTE','LEIDO','RESPONDIDO'].includes(estado)) { const e=new Error('Estado no válido'); e.status=400; throw e; }
  const contacto = await prisma.contactoProfesional.findFirst({ where: { id:Number(id), destinatarioId:Number(usuarioId) } });
  if (!contacto) { const e=new Error('Contacto no encontrado'); e.status=404; throw e; }
  return prisma.contactoProfesional.update({ where: { id: contacto.id }, data: { estado }, select: { id:true, estado:true } });
}

async function contarPendientes(usuarioId) {
  return prisma.contactoProfesional.count({ where: { destinatarioId: Number(usuarioId), estado: 'PENDIENTE' } });
}

module.exports = { crearContacto, listarRecibidos, cambiarEstado, contarPendientes };
