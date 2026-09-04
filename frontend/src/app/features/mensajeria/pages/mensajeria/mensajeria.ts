import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MensajeriaService, ConversacionResumen, MensajeInterno, UsuarioChat } from '../../../../core/services/mensajeria.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PerfilPublicoService } from '../../../../core/services/perfil-publico.service';

@Component({selector:'app-mensajeria',standalone:true,imports:[CommonModule,FormsModule,RouterLink],templateUrl:'./mensajeria.html',styleUrl:'./mensajeria.css'})
export class Mensajeria implements OnInit {
 private readonly service=inject(MensajeriaService); private readonly route=inject(ActivatedRoute); private readonly auth=inject(AuthService); private readonly perfilService=inject(PerfilPublicoService);
 conversaciones=signal<ConversacionResumen[]>([]); seleccionado=signal<ConversacionResumen|null>(null); mensajes=signal<MensajeInterno[]>([]); otro=signal<UsuarioChat|null>(null); cargando=signal(true); cargandoMensajes=signal(false); error=signal<string|null>(null); enviando=signal(false); texto=''; nuevoDestinatarioId:number|null=null;
 ngOnInit(){this.cargar();this.service.actualizacion$.subscribe(()=>{this.cargarListaSilenciosa();const c=this.seleccionado();if(c)this.abrir(c);});}
 cargar(){this.cargando.set(true);this.service.listar().subscribe({next:r=>{this.conversaciones.set(r);this.cargando.set(false);const id=Number(this.route.snapshot.paramMap.get('id'));const nuevo=Number(this.route.snapshot.queryParamMap.get('destinatario'));if(id)this.abrirId(id);else if(nuevo)this.iniciarNueva(nuevo);},error:e=>{this.error.set(e?.error?.error||'No se pudo cargar la mensajería.');this.cargando.set(false);}})}
 abrirId(id:number){const c=this.conversaciones().find(x=>x.id===id);if(c)this.abrir(c);}
 iniciarNueva(id:number){if(!id||id===this.auth.usuarioActual()?.id)return;this.nuevoDestinatarioId=id;this.perfilService.obtenerPerfil(id).subscribe({next:p=>{const otro:UsuarioChat={id:p.id,nombre:p.nombre,apellido:p.apellido,foto:p.foto,profesion:p.profesion};this.otro.set(otro);this.seleccionado.set(null);this.mensajes.set([]);},error:e=>this.error.set(e?.error?.error||'No se pudo abrir el perfil para iniciar la conversación.')});}
 abrir(c:ConversacionResumen){this.seleccionado.set(c);this.cargandoMensajes.set(true);this.service.obtener(c.id).subscribe({next:r=>{this.otro.set(r.conversacion.otro);this.mensajes.set(r.mensajes);this.cargandoMensajes.set(false);this.service.actualizarNoLeidos();},error:e=>{this.error.set(e?.error?.error||'No se pudo abrir la conversación.');this.cargandoMensajes.set(false);}})}
 enviar(){const c=this.seleccionado();const body=this.texto.trim();const destinatario=c?.otro.id ?? this.nuevoDestinatarioId;if(!destinatario||!body||this.enviando())return;this.enviando.set(true);this.service.enviar(destinatario,body).subscribe({next:m=>{this.mensajes.update(xs=>[...xs,m]);this.texto='';this.enviando.set(false);this.nuevoDestinatarioId=null;this.cargarListaSilenciosa();setTimeout(()=>{const creada=this.conversaciones().find(x=>x.otro.id===destinatario);if(creada)this.abrir(creada);},250);},error:e=>{this.error.set(e?.error?.error||'No se pudo enviar el mensaje.');this.enviando.set(false);}})}
 cargarListaSilenciosa(){this.service.listar().subscribe({next:r=>this.conversaciones.set(r)});}
 esMio(m:MensajeInterno){return m.remitenteId===this.auth.usuarioActual()?.id;}
 nombre(u:UsuarioChat|null){return u?`${u.nombre} ${u.apellido}`.trim():'Profesional';}
 iniciales(u:UsuarioChat|null){return this.nombre(u).split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
 async activarNotificaciones(){await this.service.habilitarNotificacionesNavegador();}
 notificacionesActivas(){return typeof Notification !== 'undefined' && Notification.permission === 'granted';}
 fecha(v:string){return new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}
 ultimoTexto(c:ConversacionResumen){return c.ultimo?.contenido||'Sin mensajes';}
}
