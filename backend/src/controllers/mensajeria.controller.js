const service=require('../services/mensajeria.service');
async function enviar(req,res,next){try{res.status(201).json(await service.crearMensaje({remitenteId:req.usuario.id,destinatarioId:req.body.destinatarioId,contenido:req.body.contenido}));}catch(e){next(e)}}
async function conversaciones(req,res,next){try{res.json(await service.listarConversaciones(req.usuario.id));}catch(e){next(e)}}
async function mensajes(req,res,next){try{res.json(await service.listarMensajes(req.params.id,req.usuario.id));}catch(e){next(e)}}
async function noLeidos(req,res,next){try{res.json({noLeidos:await service.contarNoLeidos(req.usuario.id)});}catch(e){next(e)}}
async function leer(req,res,next){try{res.json(await service.marcarLeidos(req.params.id,req.usuario.id));}catch(e){next(e)}}
module.exports={enviar,conversaciones,mensajes,noLeidos,leer};
