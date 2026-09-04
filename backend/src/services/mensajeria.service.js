const prisma = require('../lib/prisma');

function error(message, status = 400) { const e = new Error(message); e.status = status; return e; }
function texto(v) { return String(v ?? '').trim().slice(0, 5000); }
function par(a,b){ return Number(a) < Number(b) ? [Number(a),Number(b)] : [Number(b),Number(a)]; }

async function usuarioValido(id) {
  return prisma.usuario.findUnique({ where:{id:Number(id)}, select:{id:true,nombre:true,apellido:true,foto:true,profesion:true,empresa:true,activo:true} });
}

async function obtenerConversacion(id, usuarioId) {
  const c = await prisma.conversacion.findFirst({ where:{ id:Number(id), OR:[{usuario1Id:Number(usuarioId)},{usuario2Id:Number(usuarioId)}] }, include:{ usuario1:{select:{id:true,nombre:true,apellido:true,foto:true,profesion:true}}, usuario2:{select:{id:true,nombre:true,apellido:true,foto:true,profesion:true}} } });
  if (!c) throw error('Conversación no encontrada',404);
  return c;
}

async function crearMensaje({ remitenteId, destinatarioId, contenido }) {
  const sender = await usuarioValido(remitenteId); const target = await usuarioValido(destinatarioId);
  if (!sender || !sender.activo) throw error('Tu cuenta no está disponible',403);
  if (!target || !target.activo) throw error('El profesional no está disponible',404);
  if (Number(remitenteId) === Number(destinatarioId)) throw error('No puedes enviarte mensajes a ti mismo');
  const body = texto(contenido); if (!body) throw error('El mensaje es obligatorio');
  const [usuario1Id,usuario2Id] = par(remitenteId,destinatarioId);
  const conv = await prisma.conversacion.upsert({ where:{usuario1Id_usuario2Id:{usuario1Id,usuario2Id}}, create:{usuario1Id,usuario2Id}, update:{updatedAt:new Date()} });
  return prisma.mensajeInterno.create({ data:{contenido:body, conversacionId:conv.id, remitenteId:Number(remitenteId)}, select:{id:true,contenido:true,leido:true,createdAt:true,remitenteId:true,conversacionId:true} });
}

async function listarConversaciones(usuarioId) {
  const uid=Number(usuarioId);
  const rows=await prisma.conversacion.findMany({where:{OR:[{usuario1Id:uid},{usuario2Id:uid}]},orderBy:{updatedAt:'desc'},include:{usuario1:{select:{id:true,nombre:true,apellido:true,foto:true,profesion:true}},usuario2:{select:{id:true,nombre:true,apellido:true,foto:true,profesion:true}},mensajes:{orderBy:{createdAt:'desc'},take:1,select:{id:true,contenido:true,leido:true,createdAt:true,remitenteId:true}}}});
  return rows.map(c=>{const otro=c.usuario1Id===uid?c.usuario2:c.usuario1; const ultimo=c.mensajes[0]||null; return {id:c.id,updatedAt:c.updatedAt,otro,ultimo,noLeidos:0};});
}

async function listarMensajes(conversacionId, usuarioId) {
  const c=await obtenerConversacion(conversacionId,usuarioId);
  const mensajes=await prisma.mensajeInterno.findMany({where:{conversacionId:c.id},orderBy:{createdAt:'asc'},select:{id:true,contenido:true,leido:true,createdAt:true,remitenteId:true,conversacionId:true}});
  await prisma.mensajeInterno.updateMany({where:{conversacionId:c.id,remitenteId:{not:Number(usuarioId)},leido:false},data:{leido:true}});
  const otro=c.usuario1Id===Number(usuarioId)?c.usuario2:c.usuario1;
  return {conversacion:{id:c.id,otro},mensajes};
}

async function contarNoLeidos(usuarioId) {
  return prisma.mensajeInterno.count({where:{leido:false,remitenteId:{not:Number(usuarioId)},conversacion:{OR:[{usuario1Id:Number(usuarioId)},{usuario2Id:Number(usuarioId)}]}}});
}

async function marcarLeidos(conversacionId, usuarioId) {
  const c=await obtenerConversacion(conversacionId,usuarioId);
  await prisma.mensajeInterno.updateMany({where:{conversacionId:c.id,remitenteId:{not:Number(usuarioId)},leido:false},data:{leido:true}});
  return {ok:true};
}
module.exports={crearMensaje,listarConversaciones,listarMensajes,contarNoLeidos,marcarLeidos};
