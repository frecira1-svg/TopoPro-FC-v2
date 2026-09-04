const service = require('../services/contactoProfesional.service');

async function crear(req,res,next){ try { const data=await service.crearContacto({ remitenteId:req.usuario.id,destinatarioId:req.params.usuarioId,asunto:req.body.asunto,mensaje:req.body.mensaje }); res.status(201).json({ mensaje: data.notificado ? 'Mensaje enviado correctamente' : 'Mensaje recibido y guardado. La notificación por correo está pendiente.', contactoId:data.id, notificado:data.notificado }); } catch(e){ next(e); } }
async function recibidos(req,res,next){ try { res.json(await service.listarRecibidos(req.usuario.id)); } catch(e){ next(e); } }
async function pendientes(req,res,next){ try { res.json({ pendientes: await service.contarPendientes(req.usuario.id) }); } catch(e){ next(e); } }
async function estado(req,res,next){ try { res.json(await service.cambiarEstado(req.params.id,req.usuario.id,req.body.estado)); } catch(e){ next(e); } }
module.exports={crear,recibidos,pendientes,estado};
