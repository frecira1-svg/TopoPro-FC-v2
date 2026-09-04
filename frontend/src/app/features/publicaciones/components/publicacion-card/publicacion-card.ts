import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Publicacion } from '../../../../core/models/publicacion.model';

@Component({
  selector: 'app-publicacion-card',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.css'
})
export class PublicacionCard {

  @Input({ required: true })
  publicacion!: Publicacion;

  @Input()
  usuarioId: number | null = null;

  @Input()
  esAdmin = false;

  @Output()
  editar = new EventEmitter<Publicacion>();

  @Output()
  eliminar = new EventEmitter<Publicacion>();

  @Output()
  abrir = new EventEmitter<Publicacion>();

  constructor(private router: Router) {}

  puedeEditar(): boolean {

    if (!this.publicacion) {
      return false;
    }

    return this.esAdmin ||
      this.publicacion.usuarioId === this.usuarioId;

  }

  obtenerIniciales(): string {

    if (!this.publicacion?.usuario) {

      return 'U';

    }

    const nombre = this.publicacion.usuario.nombre ?? '';
    const apellido = this.publicacion.usuario.apellido ?? '';

    return (
      nombre.charAt(0) +
      apellido.charAt(0)
    ).toUpperCase();

  }

  obtenerNombreCompleto(): string {

    if (!this.publicacion?.usuario) {

      return 'Usuario';

    }

    return `${this.publicacion.usuario.nombre} ${this.publicacion.usuario.apellido ?? ''}`.trim();

  }

  verPerfil(): void {
    this.router.navigate(['/perfil-publico', this.publicacion.usuarioId]);
  }

  editarPublicacion(): void {

    this.editar.emit(this.publicacion);

  }

  eliminarPublicacion(): void {

    this.eliminar.emit(this.publicacion);

  }

  abrirDetalle(): void {

    this.abrir.emit(this.publicacion);

  }

}
