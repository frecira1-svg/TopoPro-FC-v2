import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  Publicacion,
  ComentarioRequest
} from '../../../../core/models/publicacion.model';

@Component({
  selector: 'app-publicacion-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.css'
})
export class PublicacionDetalle implements OnChanges {

  @Input()
  visible = false;

  @Input()
  publicacion: Publicacion | null = null;

  @Input()
  usuarioId: number | null = null;

  @Input()
  esAdmin = false;

  @Output()
  cerrar = new EventEmitter<void>();

  @Output()
  comentar = new EventEmitter<ComentarioRequest>();

  @Output()
  eliminarComentario = new EventEmitter<number>();

  comentario = '';
  fotoActiva = 0;

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['visible'] && this.visible) {
      this.comentario = '';
      this.fotoActiva = 0;
    }

  }

  imagenes(): string[] {
    const p = this.publicacion;
    if (!p) return [];
    if (p.imagenes?.length) return p.imagenes.slice().sort((a, b) => a.orden - b.orden).map(i => i.url);
    return p.imagen ? [p.imagen] : [];
  }

  siguienteFoto(): void {
    const total = this.imagenes().length;
    if (total) this.fotoActiva = (this.fotoActiva + 1) % total;
  }

  anteriorFoto(): void {
    const total = this.imagenes().length;
    if (total) this.fotoActiva = (this.fotoActiva - 1 + total) % total;
  }

  seleccionarFoto(index: number): void { this.fotoActiva = index; }

  enviarComentario(): void {

    if (!this.comentario.trim()) {
      return;
    }

    this.comentar.emit({
      contenido: this.comentario
    });

    this.comentario = '';

  }

  puedeEliminarComentario(usuarioComentarioId: number): boolean {

    return this.esAdmin || usuarioComentarioId === this.usuarioId;

  }

  cerrarDialogo(): void {

    this.cerrar.emit();

  }

}
