import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../core/services/auth.service';
import { Usuario } from '../../../../core/models/usuario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  usuario = signal<Usuario | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  subiendoFoto = signal(false);

  datosEditables: Partial<Usuario> = {};

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.cargando.set(true);
    this.authService.obtenerPerfil().subscribe({
      next: (respuesta) => {
        this.usuario.set(respuesta.usuario);
        this.datosEditables = {
          nombre: respuesta.usuario.nombre,
          apellido: respuesta.usuario.apellido,
          telefono: respuesta.usuario.telefono,
          profesion: respuesta.usuario.profesion,
          empresa: respuesta.usuario.empresa,
          ciudad: respuesta.usuario.ciudad,
          pais: respuesta.usuario.pais
        };
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el perfil' });
      }
    });
  }

  guardar(): void {
    if (!this.datosEditables.nombre || !this.datosEditables.apellido) {
      this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Nombre y apellido son obligatorios' });
      return;
    }

    this.guardando.set(true);
    this.authService.actualizarPerfil(this.datosEditables).subscribe({
      next: (respuesta) => {
        this.usuario.set(respuesta.usuario);
        this.guardando.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Perfil actualizado correctamente' });
      },
      error: () => {
        this.guardando.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el perfil' });
      }
    });
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];

    this.subiendoFoto.set(true);
    this.authService.subirFoto(archivo).subscribe({
      next: (respuesta) => {
        this.usuario.set(respuesta.usuario);
        this.subiendoFoto.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Foto de perfil actualizada' });
      },
      error: () => {
        this.subiendoFoto.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir la foto' });
      }
    });
  }
}
