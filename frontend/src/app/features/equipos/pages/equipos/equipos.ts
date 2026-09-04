import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { Equipo } from '../../models/equipo';
import { EquiposService } from '../../services/equipos';

import { AuthService } from '../../../../core/services/auth.service';

import {
  PermisoService,
  PermisosUsuario
} from '../../../../core/services/permiso.service';


@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './equipos.html',
  styleUrl: './equipos.css'
})
export class Equipos implements OnInit {

  private equiposService = inject(EquiposService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  private authService = inject(AuthService);
  private permisoService = inject(PermisoService);
  private cdr = inject(ChangeDetectorRef);


  // =====================================================
  // DATOS
  // =====================================================

  equipos: Equipo[] = [];

  cargando = true;

  mostrarFormulario = false;

  editando = false;

  equipoId: number | null = null;


  // =====================================================
  // PERMISOS
  // =====================================================

  permisos: PermisosUsuario | null = null;

  cargandoPermisos = true;

  puedeVer = false;

  puedeCrear = false;

  puedeEditar = false;

  puedeEliminar = false;


  // =====================================================
  // OPCIONES
  // =====================================================

  opcionesEstado = [
    'DISPONIBLE',
    'EN_USO',
    'MANTENIMIENTO'
  ];


  // =====================================================
  // FORMULARIO
  // =====================================================

  formulario: FormGroup = this.fb.group({

    nombre: [
      '',
      Validators.required
    ],

    tipo: [
      '',
      Validators.required
    ],

    marca: [''],

    modelo: [''],

    numeroSerie: [''],

    fechaCompra: [''],

    estado: ['DISPONIBLE']

  });


  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  get disponibles(): number {

    return this.equipos.filter(
      e => e.estado === 'DISPONIBLE'
    ).length;

  }


  get enUso(): number {

    return this.equipos.filter(
      e => e.estado === 'EN_USO'
    ).length;

  }


  // =====================================================
  // INICIO
  // =====================================================

  ngOnInit(): void {

    this.cargarPermisos();

  }


  // =====================================================
  // CARGAR PERMISOS
  // =====================================================

  cargarPermisos(): void {

    const usuario =
      this.authService.usuarioActual();


    if (!usuario) {

      this.cargandoPermisos = false;

      this.puedeVer = false;
      this.puedeCrear = false;
      this.puedeEditar = false;
      this.puedeEliminar = false;

      return;
    }


    // =================================================
    // ADMIN = ACCESO TOTAL
    // =================================================

    if (usuario.rol === 'ADMIN') {

      this.puedeVer = true;
      this.puedeCrear = true;
      this.puedeEditar = true;
      this.puedeEliminar = true;

      this.cargandoPermisos = false;

      this.cargarEquipos();

      return;
    }


    // =================================================
    // USUARIO = SUS PROPIOS PERMISOS
    // =================================================

    this.permisoService
      .obtenerMisPermisos()
      .subscribe({

        next: (permisos) => {

          this.permisos = permisos;

          this.puedeVer =
            permisos.equiposVer;

          this.puedeCrear =
            permisos.equiposCrear;

          this.puedeEditar =
            permisos.equiposEditar;

          this.puedeEliminar =
            permisos.equiposEliminar;

          this.cargandoPermisos = false;


          // -------------------------------------------
          // SOLO CARGAR SI PUEDE VER
          // -------------------------------------------

          if (this.puedeVer) {

            this.cargarEquipos();

          }


          this.cdr.detectChanges();

        },

        error: (error: any) => {

          this.cargandoPermisos = false;

          this.puedeVer = false;
          this.puedeCrear = false;
          this.puedeEditar = false;
          this.puedeEliminar = false;

          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudieron cargar los permisos.'

          });


          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // CARGAR EQUIPOS
  // =====================================================

  cargarEquipos(): void {

    if (!this.puedeVer) {
      return;
    }


    this.cargando = true;


    this.equiposService
      .obtenerEquipos()
      .subscribe({

        next: (respuesta: Equipo[]) => {

          this.equipos = respuesta;

          this.cargando = false;

          this.cdr.detectChanges();

        },

        error: (error: any) => {

          console.error(error);

          this.cargando = false;

          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudieron cargar los equipos.'

          });

        }

      });

  }


  // =====================================================
  // NUEVO EQUIPO
  // =====================================================

  nuevoEquipo(): void {

    if (!this.puedeCrear) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para crear equipos.'

      });

      return;

    }


    this.editando = false;

    this.equipoId = null;

    this.formulario.reset({
      estado: 'DISPONIBLE'
    });

    this.mostrarFormulario = true;

  }


  // =====================================================
  // EDITAR EQUIPO
  // =====================================================

  editarEquipo(
    equipo: Equipo
  ): void {

    if (!this.puedeEditar) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para editar equipos.'

      });

      return;

    }


    this.editando = true;

    this.equipoId =
      equipo.id ?? null;


    this.formulario.patchValue({

      ...equipo,

      fechaCompra:
        equipo.fechaCompra
          ? equipo.fechaCompra.substring(0, 10)
          : ''

    });


    this.mostrarFormulario = true;

  }


  // =====================================================
  // GUARDAR EQUIPO
  // =====================================================

  guardarEquipo(): void {

    // ---------------------------------------------------
    // EDICIÓN
    // ---------------------------------------------------

    if (
      this.editando &&
      !this.puedeEditar
    ) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para editar equipos.'

      });

      return;

    }


    // ---------------------------------------------------
    // CREACIÓN
    // ---------------------------------------------------

    if (
      !this.editando &&
      !this.puedeCrear
    ) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para crear equipos.'

      });

      return;

    }


    // ---------------------------------------------------
    // VALIDACIÓN
    // ---------------------------------------------------

    if (this.formulario.invalid) {

      this.formulario.markAllAsTouched();

      this.messageService.add({

        severity: 'warn',

        summary: 'Datos incompletos',

        detail:
          'Revisa los campos obligatorios del formulario.'

      });

      return;

    }


    const datos: Equipo =
      this.formulario.value;


    // =================================================
    // ACTUALIZAR
    // =================================================

    if (
      this.editando &&
      this.equipoId
    ) {

      this.equiposService
        .actualizarEquipo(
          this.equipoId,
          datos
        )
        .subscribe({

          next: () => {

            this.mostrarFormulario = false;

            this.messageService.add({

              severity: 'success',

              summary: 'Éxito',

              detail:
                'Equipo actualizado correctamente.'

            });

            this.cargarEquipos();

          },

          error: (error: any) => {

            console.error(error);

            this.messageService.add({

              severity: 'error',

              summary: 'Error',

              detail:
                error?.error?.error ||
                'No se pudo actualizar el equipo.'

            });

          }

        });


      return;

    }


    // =================================================
    // CREAR
    // =================================================

    this.equiposService
      .crearEquipo(datos)
      .subscribe({

        next: () => {

          this.mostrarFormulario = false;

          this.messageService.add({

            severity: 'success',

            summary: 'Éxito',

            detail:
              'Equipo creado correctamente.'

          });

          this.cargarEquipos();

        },

        error: (error: any) => {

          console.error(error);

          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudo crear el equipo.'

          });

        }

      });

  }


  // =====================================================
  // ELIMINAR EQUIPO
  // =====================================================

  eliminarEquipo(
    equipo: Equipo
  ): void {

    if (!this.puedeEliminar) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para eliminar equipos.'

      });

      return;

    }


    if (!equipo.id) {
      return;
    }


    if (
      !confirm(
        `¿Eliminar el equipo "${equipo.nombre}"?`
      )
    ) {

      return;

    }


    this.equiposService
      .eliminarEquipo(
        equipo.id
      )
      .subscribe({

        next: () => {

          this.messageService.add({

            severity: 'success',

            summary: 'Eliminado',

            detail:
              'Equipo eliminado correctamente.'

          });

          this.cargarEquipos();

        },

        error: (error: any) => {

          console.error(error);

          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudo eliminar el equipo.'

          });

        }

      });

  }


  // =====================================================
  // CANCELAR
  // =====================================================

  cancelar(): void {

    this.mostrarFormulario = false;

    this.formulario.reset({
      estado: 'DISPONIBLE'
    });

  }

}
