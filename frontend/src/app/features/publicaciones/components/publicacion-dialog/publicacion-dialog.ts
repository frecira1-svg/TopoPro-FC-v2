import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MessageService } from 'primeng/api';

import { PublicacionRequest } from '../../../../core/models/publicacion.model';

@Component({
  selector: 'app-publicacion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './publicacion-dialog.html',
  styleUrl: './publicacion-dialog.css'
})
export class PublicacionDialog implements OnChanges {

  @Input()
  visible = false;

  @Input()
  esAdmin = false;

  @Input()
  modoEdicion = false;

  @Input()
  publicacion: PublicacionRequest = this.formularioVacio();

  @Output()
  guardar = new EventEmitter<PublicacionRequest>();

  @Output()
  cerrar = new EventEmitter<void>();

  modelo: PublicacionRequest = this.formularioVacio();
  nombreImagenSeleccionada = '';
  vistaPreviaImagen: string | null = null;
  archivosImagenes: File[] = [];
  vistasPreviaImagenes: string[] = [];

  constructor(private messageService: MessageService) {}

  ngOnChanges(changes: SimpleChanges): void {

  if (changes['publicacion'] || changes['visible']) {

    this.modelo = {

      titulo: this.publicacion?.titulo ?? '',
      contenido: this.publicacion?.contenido ?? '',
      tipo: this.publicacion?.tipo ?? 'COMUNIDAD',
      imagen: this.publicacion?.imagen ?? '',
      tipoTrabajo: this.publicacion?.tipoTrabajo ?? '',
      ubicacion: this.publicacion?.ubicacion ?? '',
      etiquetas: this.publicacion?.etiquetas ?? '',
      imagenArchivo: undefined

    };

    this.nombreImagenSeleccionada = '';
    this.vistaPreviaImagen = this.modelo.imagen || null;
    this.archivosImagenes = [];
    this.vistasPreviaImagenes = [];

  }

}

  seleccionarImagenes(event: Event): void {
    const input = event.target as HTMLInputElement;
    const seleccionadas = Array.from(input.files ?? []);
    if (!seleccionadas.length) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const disponibles = 10 - this.archivosImagenes.length;
    if (seleccionadas.length > disponibles) {
      this.messageService.add({ severity: 'warn', summary: 'Máximo 10 fotografías', detail: `Puedes agregar ${disponibles} fotografía(s) más.` });
      input.value = '';
      return;
    }

    for (const archivo of seleccionadas) {
      if (!tiposPermitidos.includes(archivo.type)) {
        this.messageService.add({ severity: 'warn', summary: 'Formato no permitido', detail: 'Solo JPG, PNG o WEBP.' });
        input.value = '';
        return;
      }
      if (archivo.size > 8 * 1024 * 1024) {
        this.messageService.add({ severity: 'warn', summary: 'Imagen demasiado grande', detail: `${archivo.name} supera los 8 MB.` });
        input.value = '';
        return;
      }
    }

    this.archivosImagenes = [...this.archivosImagenes, ...seleccionadas];
    seleccionadas.forEach(archivo => {
      const reader = new FileReader();
      reader.onload = () => this.vistasPreviaImagenes = [...this.vistasPreviaImagenes, reader.result as string];
      reader.readAsDataURL(archivo);
    });
    if (!this.vistaPreviaImagen && seleccionadas[0]) this.vistaPreviaImagen = URL.createObjectURL(seleccionadas[0]);
    input.value = '';
  }

  quitarImagen(index: number): void {
    this.archivosImagenes = this.archivosImagenes.filter((_, i) => i !== index);
    this.vistasPreviaImagenes = this.vistasPreviaImagenes.filter((_, i) => i !== index);
  }

  guardarPublicacion(): void {

  if (!this.modelo.titulo?.trim()) {

    this.messageService.add({
      severity: 'warn',
      summary: 'Datos incompletos',
      detail: 'Debe ingresar un título.'
    });

    return;
  }

  if (!this.modelo.contenido?.trim()) {

    this.messageService.add({
      severity: 'warn',
      summary: 'Datos incompletos',
      detail: 'Debe ingresar un contenido.'
    });

    return;
  }

  this.guardar.emit({

    ...this.modelo,

    tipo: this.esAdmin
      ? this.modelo.tipo
      : 'COMUNIDAD',

    imagenesArchivos: [...this.archivosImagenes]

  });

}

  cerrarDialogo(): void {

    this.cerrar.emit();

  }

  private formularioVacio(): PublicacionRequest {

    return {

      titulo: '',

      contenido: '',

      tipo: 'COMUNIDAD',

      imagen: '',
      tipoTrabajo: '',
      ubicacion: '',
      etiquetas: ''

    };

  }

}
