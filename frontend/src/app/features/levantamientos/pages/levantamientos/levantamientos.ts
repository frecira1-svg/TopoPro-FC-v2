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

import { Levantamiento } from '../../models/levantamiento';
import { LevantamientosService } from '../../services/levantamientos';

import { Proyecto } from '../../../../core/models/proyecto.model';
import { ProyectoService } from '../../../../core/services/proyecto.service';

import { Equipo } from '../../../equipos/models/equipo';
import { EquiposService } from '../../../equipos/services/equipos';

import { AuthService } from '../../../../core/services/auth.service';
import {
  PermisoService,
  PermisosUsuario
} from '../../../../core/services/permiso.service';


@Component({
  selector: 'app-levantamientos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './levantamientos.html',
  styleUrl: './levantamientos.css'
})
export class Levantamientos implements OnInit {

  private levantamientosService =
    inject(LevantamientosService);

  private proyectoService =
    inject(ProyectoService);

  private equiposService =
    inject(EquiposService);

  private fb =
    inject(FormBuilder);

  private messageService =
    inject(MessageService);

  private authService =
    inject(AuthService);

  private permisoService =
    inject(PermisoService);

  private cdr =
    inject(ChangeDetectorRef);


  // =====================================================
  // DATOS
  // =====================================================

  levantamientos: Levantamiento[] = [];

  proyectos: Proyecto[] = [];

  equipos: Equipo[] = [];


  // =====================================================
  // ESTADOS
  // =====================================================

  cargando = true;

  mostrarFormulario = false;

  editando = false;

  levantamientoId: number | null = null;


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
    'PLANIFICADO',
    'EN_CAMPO',
    'COMPLETADO'
  ];


  // =====================================================
  // FORMULARIO
  // =====================================================

  formulario: FormGroup = this.fb.group({

    fecha: [''],

    descripcion: [''],

    observaciones: [''],

    estado: ['PLANIFICADO'],

    proyectoId: [
      null,
      Validators.required
    ],

    equipoId: [null]

  });


  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  get planificados(): number {

    return this.levantamientos.filter(
      l => l.estado === 'PLANIFICADO'
    ).length;

  }


  get enCampo(): number {

    return this.levantamientos.filter(
      l => l.estado === 'EN_CAMPO'
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
    // ADMIN → ACCESO TOTAL
    // =================================================

    if (usuario.rol === 'ADMIN') {

      this.puedeVer = true;
      this.puedeCrear = true;
      this.puedeEditar = true;
      this.puedeEliminar = true;

      this.cargandoPermisos = false;

      this.cargarProyectos();
      this.cargarEquipos();
      this.cargarLevantamientos();

      return;
    }


    // =================================================
    // USUARIO → SUS PROPIOS PERMISOS
    // =================================================

    this.permisoService
      .obtenerMisPermisos()
      .subscribe({

        next: (permisos) => {

          this.permisos = permisos;

          this.puedeVer =
            permisos.levantamientosVer;

          this.puedeCrear =
            permisos.levantamientosCrear;

          this.puedeEditar =
            permisos.levantamientosEditar;

          this.puedeEliminar =
            permisos.levantamientosEliminar;

          this.cargandoPermisos = false;


          // -------------------------------------------
          // SOLO CARGAR LA LISTA SI PUEDE VER
          // -------------------------------------------

          if (this.puedeVer) {

            this.cargarLevantamientos();

          }


          // -------------------------------------------
          // LOS DATOS AUXILIARES SE CARGAN SI TIENE
          // ALGUNA OPERACIÓN QUE REQUIERA EL FORMULARIO
          // -------------------------------------------

          if (
            this.puedeCrear ||
            this.puedeEditar
          ) {

            this.cargarProyectos();
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
  // CARGAR PROYECTOS
  // =====================================================

  cargarProyectos(): void {

    this.proyectoService
      .obtenerTodos()
      .subscribe({

        next: (data) => {

          this.proyectos = data;

        },

        error: (error) => {

          console.error(error);

          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudieron cargar los proyectos.'

          });

        }

      });

  }


  // =====================================================
  // CARGAR EQUIPOS
  // =====================================================

  cargarEquipos(): void {

    this.equiposService
      .obtenerEquipos()
      .subscribe({

        next: (data) => {

          this.equipos = data;

        },

        error: (error) => {

          console.error(error);

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
  // CARGAR LEVANTAMIENTOS
  // =====================================================

  cargarLevantamientos(): void {

    if (!this.puedeVer) {
      return;
    }


    this.cargando = true;


    this.levantamientosService
      .obtenerLevantamientos()
      .subscribe({

        next: (respuesta: Levantamiento[]) => {

          this.levantamientos = respuesta;

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
              'No se pudieron cargar los levantamientos.'

          });

        }

      });

  }


  // =====================================================
  // NOMBRE PROYECTO
  // =====================================================

  nombreProyecto(id: number): string {

    return this.proyectos.find(
      p => p.id === id
    )?.nombre || '-';

  }


  // =====================================================
  // NOMBRE EQUIPO
  // =====================================================

  nombreEquipo(
    id: number | null | undefined
  ): string {

    if (!id) {
      return '-';
    }

    return this.equipos.find(
      e => e.id === id
    )?.nombre || '-';

  }


  // =====================================================
  // NUEVO LEVANTAMIENTO
  // =====================================================

  nuevoLevantamiento(): void {

    if (!this.puedeCrear) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para crear levantamientos.'

      });

      return;

    }


    this.editando = false;

    this.levantamientoId = null;

    this.formulario.reset({
      estado: 'PLANIFICADO'
    });

    this.mostrarFormulario = true;

  }


  // =====================================================
  // EDITAR LEVANTAMIENTO
  // =====================================================

  editarLevantamiento(
    levantamiento: Levantamiento
  ): void {

    if (!this.puedeEditar) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para editar levantamientos.'

      });

      return;

    }


    this.editando = true;

    this.levantamientoId =
      levantamiento.id ?? null;


    this.formulario.patchValue({

      ...levantamiento,

      fecha:
        levantamiento.fecha
          ? levantamiento.fecha.substring(0, 10)
          : ''

    });


    this.mostrarFormulario = true;

  }


  // =====================================================
  // GUARDAR LEVANTAMIENTO
  // =====================================================

  guardarLevantamiento(): void {


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
          'No tienes permiso para editar levantamientos.'

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
          'No tienes permiso para crear levantamientos.'

      });

      return;

    }


    // ---------------------------------------------------
    // VALIDAR FORMULARIO
    // ---------------------------------------------------

    if (this.formulario.invalid) {

      this.formulario.markAllAsTouched();

      this.messageService.add({

        severity: 'warn',

        summary: 'Datos incompletos',

        detail:
          'Selecciona un proyecto para el levantamiento.'

      });

      return;

    }


    const datos: Levantamiento =
      this.formulario.value;


    // =================================================
    // ACTUALIZAR
    // =================================================

    if (
      this.editando &&
      this.levantamientoId
    ) {

      this.levantamientosService
        .actualizarLevantamiento(
          this.levantamientoId,
          datos
        )
        .subscribe({

          next: () => {

            this.mostrarFormulario = false;

            this.messageService.add({

              severity: 'success',

              summary: 'Éxito',

              detail:
                'Levantamiento actualizado correctamente.'

            });

            this.cargarLevantamientos();

          },

          error: (error: any) => {

            console.error(error);

            this.messageService.add({

              severity: 'error',

              summary: 'Error',

              detail:
                error?.error?.error ||
                'No se pudo actualizar el levantamiento.'

            });

          }

        });


      return;

    }


    // =================================================
    // CREAR
    // =================================================

    this.levantamientosService
      .crearLevantamiento(datos)
      .subscribe({

        next: () => {

          this.mostrarFormulario = false;

          this.messageService.add({

            severity: 'success',

            summary: 'Éxito',

            detail:
              'Levantamiento creado correctamente.'

          });

          this.cargarLevantamientos();

        },

        error: (error: any) => {

          console.error(error);

          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudo crear el levantamiento.'

          });

        }

      });

  }


  // =====================================================
  // ELIMINAR
  // =====================================================

  eliminarLevantamiento(
    levantamiento: Levantamiento
  ): void {

    if (!this.puedeEliminar) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para eliminar levantamientos.'

      });

      return;

    }


    if (!levantamiento.id) {
      return;
    }


    if (
      !confirm(
        '¿Eliminar este levantamiento?'
      )
    ) {

      return;

    }


    this.levantamientosService
      .eliminarLevantamiento(
        levantamiento.id
      )
      .subscribe({

        next: () => {

          this.messageService.add({

            severity: 'success',

            summary: 'Eliminado',

            detail:
              'Levantamiento eliminado correctamente.'

          });

          this.cargarLevantamientos();

        },

        error: (error: any) => {

          console.error(error);

          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudo eliminar el levantamiento.'

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
      estado: 'PLANIFICADO'
    });

  }

}
