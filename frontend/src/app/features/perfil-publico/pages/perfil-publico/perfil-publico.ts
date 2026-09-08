import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PerfilPublicoService } from '../../../../core/services/perfil-publico.service';
import { PerfilPublico as PerfilPublicoModel } from '../../../../core/models/perfil-publico.model';
import { Publicacion, PublicacionImagen } from '../../../../core/models/publicacion.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ContactoProfesionalService } from '../../../../core/services/contacto-profesional.service';
import { PublicacionCard } from '../../../publicaciones/components/publicacion-card/publicacion-card';

@Component({
  selector: 'app-perfil-publico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PublicacionCard],
  templateUrl: './perfil-publico.html',
  styleUrl: './perfil-publico.css'
})
export class PerfilPublico implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly perfilService = inject(PerfilPublicoService);
  private readonly auth = inject(AuthService);
  private readonly contactoService = inject(ContactoProfesionalService);
  private readonly router = inject(Router);

  perfil = signal<PerfilPublicoModel | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  enlaceCopiado = signal(false);
  contactoAbierto = signal(false);
  enviandoContacto = signal(false);
  contactoExito = signal<string | null>(null);
  contactoError = signal<string | null>(null);
  asuntoContacto = '';
  mensajeContacto = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.cargando.set(false);
      this.error.set('El perfil solicitado no es válido.');
      return;
    }

    this.perfilService.obtenerPerfil(id).subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.cargando.set(false);
      },
      error: err => {
        this.error.set(err?.error?.error || 'No se pudo cargar el perfil profesional.');
        this.cargando.set(false);
      }
    });
  }

  nombreCompleto(): string {
    const p = this.perfil();
    return p ? `${p.nombre} ${p.apellido}`.trim() : 'Profesional';
  }

  iniciales(): string {
    const p = this.perfil();
    if (!p) return 'TP';
    return `${p.nombre?.charAt(0) ?? ''}${p.apellido?.charAt(0) ?? ''}`.toUpperCase();
  }

  publicaciones(): Publicacion[] {
    return this.perfil()?.publicaciones ?? [];
  }

  fotos(): PublicacionImagen[] {
    const resultado: PublicacionImagen[] = [];
    for (const publicacion of this.publicaciones()) {
      if (publicacion.imagenes?.length) {
        resultado.push(...publicacion.imagenes);
      } else if (publicacion.imagen) {
        resultado.push({ id: -publicacion.id, url: publicacion.imagen, orden: 0 });
      }
    }
    return resultado;
  }

  tiposTrabajo(): string[] {
    return [...new Set(this.publicaciones().map(p => p.tipoTrabajo).filter((v): v is string => !!v && !!v.trim()))].slice(0, 8);
  }

  totalFotos(): number {
    return this.fotos().length;
  }

  trabajosDestacados(): Publicacion[] {
    return this.publicaciones().slice(0, 3);
  }

  puedeContactar(): boolean {
    const p = this.perfil();
    const actual = this.auth.usuarioActual();
    return !!p && !!actual && actual.id !== p.id && this.auth.estaAutenticado();
  }

  abrirContacto(): void {
    this.contactoExito.set(null);
    this.contactoError.set(null);
    this.asuntoContacto = '';
    this.mensajeContacto = '';
    this.contactoAbierto.set(true);
  }

  cerrarContacto(): void {
    if (!this.enviandoContacto()) this.contactoAbierto.set(false);
  }

  enviarContacto(): void {
    const p = this.perfil();
    const mensaje = this.mensajeContacto.trim();
    if (!p || !mensaje || this.enviandoContacto()) return;
    this.enviandoContacto.set(true);
    this.contactoError.set(null);
    this.contactoService.enviar(p.id, { asunto: this.asuntoContacto.trim() || undefined, mensaje }).subscribe({
      next: r => {
        this.enviandoContacto.set(false);
        this.contactoExito.set(r.mensaje);
        this.mensajeContacto = '';
        this.asuntoContacto = '';
        setTimeout(() => this.contactoAbierto.set(false), 1800);
      },
      error: err => {
        this.enviandoContacto.set(false);
        this.contactoError.set(err?.error?.error || 'No pudimos enviar tu mensaje.');
      }
    });
  }

  enviarMensajeInterno(): void {
  const p = this.perfil();

  if (!p || !this.auth.estaAutenticado() || this.auth.usuarioActual()?.id === p.id) {
    return;
  }

  this.router.navigate(['/mensajes', p.id]);
}

  copiarPerfil(): void {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.enlaceCopiado.set(true);
      setTimeout(() => this.enlaceCopiado.set(false), 2200);
    });
  }
}
