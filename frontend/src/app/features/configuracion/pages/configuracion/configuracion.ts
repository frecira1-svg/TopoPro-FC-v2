import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService, Tema } from '../../../../core/services/theme.service';
import {
  PermisoService,
  UsuarioResumen,
  PermisosUsuario
} from '../../../../core/services/permiso.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class Configuracion implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private permisoService = inject(PermisoService);
  private cdr = inject(ChangeDetectorRef);

  themeService = inject(ThemeService);

  guardandoPassword = false;

  formularioPassword: FormGroup = this.fb.group({
    passwordActual: ['', Validators.required],
    passwordNueva: [
      '',
      [
        Validators.required,
        Validators.minLength(8)
      ]
    ],
    confirmarPassword: ['', Validators.required]
  });

  usuarios: UsuarioResumen[] = [];
  usuarioSeleccionadoId: number | null = null;
  permisos: PermisosUsuario | null = null;

  cargandoUsuarios = true;
  cargandoPermisos = false;
  guardandoPermisos = false;


  // =========================================================
  // ADMIN
  // =========================================================

  esAdmin(): boolean {
    return this.authService.usuarioActual()?.rol === 'ADMIN';
  }


  // =========================================================
  // INICIO
  // =========================================================

  ngOnInit(): void {

    if (!this.esAdmin()) {
      this.cargandoUsuarios = false;
      return;
    }

    this.cargarUsuarios();

  }


  // =========================================================
  // USUARIOS
  // =========================================================

  cargarUsuarios(): void {

    this.cargandoUsuarios = true;

    this.permisoService.obtenerUsuarios().subscribe({

      next: (usuarios) => {

        this.usuarios = usuarios;
        this.cargandoUsuarios = false;

      },

      error: (error: any) => {

        this.cargandoUsuarios = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            error?.error?.error ||
            'No se pudieron cargar los usuarios.'
        });

      }

    });

  }


  // =========================================================
  // SELECCIONAR USUARIO
  // =========================================================

  seleccionarUsuario(event: Event): void {

    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);

    if (!id) {

      this.usuarioSeleccionadoId = null;
      this.permisos = null;
      this.cargandoPermisos = false;

      return;
    }

    this.usuarioSeleccionadoId = id;

    this.cargarPermisos(id);

  }


  // =========================================================
  // CARGAR PERMISOS
  // =========================================================

  cargarPermisos(usuarioId: number): void {

    this.cargandoPermisos = true;
    this.permisos = null;

    this.permisoService.obtenerPermisos(usuarioId).subscribe({

      next: (permisos) => {

        this.permisos = permisos;
        this.cargandoPermisos = false;

        /*
         * Forzamos la actualización visual porque comprobamos
         * que el estado del componente se actualiza correctamente
         * pero la vista necesitaba una detección explícita.
         */
        this.cdr.detectChanges();

      },

      error: (error: any) => {

        this.permisos = null;
        this.cargandoPermisos = false;

        this.cdr.detectChanges();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            error?.error?.error ||
            'No se pudieron cargar los permisos.'
        });

      }

    });

  }


  // =========================================================
  // GUARDAR PERMISOS
  // =========================================================

  guardarPermisos(): void {

    if (
      !this.usuarioSeleccionadoId ||
      !this.permisos
    ) {
      return;
    }

    this.guardandoPermisos = true;

    const {
      id,
      usuarioId,
      createdAt,
      updatedAt,
      ...datos
    } = this.permisos;

    this.permisoService
      .actualizarPermisos(
        this.usuarioSeleccionadoId,
        datos
      )
      .subscribe({

        next: (permisos) => {

          this.permisos = permisos;
          this.guardandoPermisos = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail:
              'Permisos actualizados correctamente.'
          });

        },

        error: (error: any) => {

          this.guardandoPermisos = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              error?.error?.error ||
              'No se pudieron actualizar los permisos.'
          });

        }

      });

  }


  // =========================================================
  // CAMBIAR CONTRASEÑA
  // =========================================================

  cambiarPassword(): void {

    if (this.formularioPassword.invalid) {

      this.formularioPassword.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail:
          'Completa todos los campos. La nueva contraseña debe tener al menos 8 caracteres.'
      });

      return;
    }

    const {
      passwordActual,
      passwordNueva,
      confirmarPassword
    } = this.formularioPassword.value;

    if (passwordNueva !== confirmarPassword) {

      this.messageService.add({
        severity: 'warn',
        summary: 'Las contraseñas no coinciden',
        detail:
          'La nueva contraseña y su confirmación deben ser iguales.'
      });

      return;
    }

    this.guardandoPassword = true;

    this.authService
      .cambiarPassword({
        passwordActual,
        passwordNueva
      })
      .subscribe({

        next: () => {

          this.guardandoPassword = false;

          this.formularioPassword.reset();

          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail:
              'Contraseña actualizada correctamente.'
          });

        },

        error: (error: any) => {

          this.guardandoPassword = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              error?.error?.error ||
              'No se pudo actualizar la contraseña.'
          });

        }

      });

  }


  // =========================================================
  // TEMA
  // =========================================================

  cambiarTema(event: Event): void {

    const select = event.target as HTMLSelectElement;
    const valor = select.value as Tema;

    this.themeService.establecerTema(valor);

  }

}
