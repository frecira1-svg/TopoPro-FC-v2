import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactoProfesionalService } from '../../../../core/services/contacto-profesional.service';

interface Contacto { id:number; asunto:string|null; mensaje:string; nombreContacto:string; correoContacto:string; estado:'PENDIENTE'|'LEIDO'|'RESPONDIDO'; createdAt:string; remitenteId:number; }

@Component({ selector:'app-bandeja-contactos', standalone:true, imports:[CommonModule,RouterLink], templateUrl:'./bandeja-contactos.html', styleUrl:'./bandeja-contactos.css' })
export class BandejaContactos implements OnInit {
  private readonly service=inject(ContactoProfesionalService);
  contactos=signal<Contacto[]>([]); cargando=signal(true); error=signal<string|null>(null); seleccionado=signal<Contacto|null>(null); filtro=signal<'TODOS'|'PENDIENTE'|'LEIDO'|'RESPONDIDO'>('TODOS');
  ngOnInit(){ this.cargar(); }
  cargar(){ this.cargando.set(true); this.service.recibidos().subscribe({next:r=>{this.contactos.set(r as Contacto[]);this.cargando.set(false)},error:e=>{this.error.set(e?.error?.error||'No se pudo cargar la bandeja de contactos.');this.cargando.set(false)}}); }
  lista(){ const f=this.filtro(); return f==='TODOS'?this.contactos():this.contactos().filter(c=>c.estado===f); }
  pendientes(){ return this.contactos().filter(c=>c.estado==='PENDIENTE').length; }
  abrir(c:Contacto){ this.seleccionado.set(c); if(c.estado==='PENDIENTE') this.marcar(c,'LEIDO'); }
  cerrar(){this.seleccionado.set(null)}
  marcar(c:Contacto, estado:'PENDIENTE'|'LEIDO'|'RESPONDIDO'){ this.service.cambiarEstado(c.id,estado).subscribe({next:()=>{ this.contactos.update(xs=>xs.map(x=>x.id===c.id?{...x,estado}:x)); this.service.actualizarPendientes(); },error:()=>{}}); }
  responder(c:Contacto){ window.location.href=`mailto:${encodeURIComponent(c.correoContacto)}?subject=${encodeURIComponent('Re: '+(c.asunto||'Contacto profesional'))}`; }
  fecha(v:string){ return new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)); }
  iniciales(n:string){ return n.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
}
