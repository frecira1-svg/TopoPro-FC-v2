import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  TableModule
} from 'primeng/table';

import {
  ButtonModule
} from 'primeng/button';

import {
  DialogModule
} from 'primeng/dialog';

import {
  InputTextModule
} from 'primeng/inputtext';

import {
  TextareaModule
} from 'primeng/textarea';

import {
  SelectModule
} from 'primeng/select';

import {
  TagModule
} from 'primeng/tag';

import {
  ConfirmDialogModule
} from 'primeng/confirmdialog';

import {
  ToastModule
} from 'primeng/toast';

import {
  ConfirmationService,
  MessageService
} from 'primeng/api';

import {
  ProyectoService
} from '../../../../core/services/proyecto.service';

import {
  Proyecto,
  ProyectoRequest
} from '../../../../core/models/proyecto.model';

import {
  Cliente
} from '../../../../core/models/cliente.model';

import {
  ClienteService
} from '../../../../core/services/cliente.service';

import {
  AuthService
} from '../../../../core/services/auth.service';

import {
  PermisoService,
  PermisosUsuario
} from '../../../../core/services/permiso.service';


@Component({
  selector: 'app-proyectos',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule
  ],

  providers: [
    ConfirmationService,
    MessageService
  ],

  templateUrl: './proyectos.html',

  styleUrl: './proyectos.css'
})


export class Proyectos implements OnInit {


  // =====================================================
  // PROYECTOS
  // =====================================================

  proyectos = signal<Proyecto[]>([]);

  cargando = signal(false);


  // =====================================================
  // CLIENTES
  // =====================================================

  clientes: Cliente[] = [];

  cargandoClientes = signal(false);


  // =====================================================
  // DIÁLOGO
  // =====================================================

  dialogoVisible = signal(false);

  modoEdicion = signal(false);


  // =====================================================
  // FORMULARIO
  // =====================================================

  filtroTexto = '';

  proyectoActual: ProyectoRequest =
    this.formularioVacio();

  idEnEdicion: number | null = null;


  // =====================================================
  // PERMISOS
  // =====================================================

  permisos: PermisosUsuario | null = null;

  cargandoPermisos = signal(true);

  puedeVer = signal(false);

  puedeCrear = signal(false);

  puedeEditar = signal(false);

  puedeEliminar = signal(false);


  // =====================================================
  // ESTADOS
  // =====================================================

  opcionesEstado = [

    {
      label: 'En Progreso',
      value: 'EN_PROGRESO'
    },

    {
      label: 'Finalizado',
      value: 'FINALIZADO'
    },

    {
      label: 'Pausado',
      value: 'PAUSADO'
    },

    {
      label: 'Cancelado',
      value: 'CANCELADO'
    }

  ];


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private proyectoService: ProyectoService,

    private confirmationService: ConfirmationService,

    private messageService: MessageService,

    private router: Router,

    private authService: AuthService,

    private permisoService: PermisoService,

    private clienteService: ClienteService

  ) {}


  // =====================================================
  // INICIO
  // =====================================================

  ngOnInit(): void {

    this.cargarPermisos();

    this.cargarClientes();

  }


  // =====================================================
  // CARGAR PERMISOS
  // =====================================================

  cargarPermisos(): void {

    const usuario =
      this.authService.usuarioActual();


    // ---------------------------------------------------
    // SIN USUARIO
    // ---------------------------------------------------

    if (!usuario) {

      this.cargandoPermisos.set(false);

      this.puedeVer.set(false);

      this.puedeCrear.set(false);

      this.puedeEditar.set(false);

      this.puedeEliminar.set(false);

      return;
    }


    // ---------------------------------------------------
    // ADMINISTRADOR
    // ---------------------------------------------------

    if (usuario.rol === 'ADMIN') {

      this.puedeVer.set(true);

      this.puedeCrear.set(true);

      this.puedeEditar.set(true);

      this.puedeEliminar.set(true);

      this.cargandoPermisos.set(false);

      this.cargarProyectos();

      return;
    }


    // ---------------------------------------------------
    // USUARIO NORMAL
    // ---------------------------------------------------

    this.permisoService
      .obtenerMisPermisos()
      .subscribe({

        next: (permisos: PermisosUsuario) => {

          this.permisos = permisos;


          this.puedeVer.set(
            permisos.proyectosVer
          );


          this.puedeCrear.set(
            permisos.proyectosCrear
          );


          this.puedeEditar.set(
            permisos.proyectosEditar
          );


          this.puedeEliminar.set(
            permisos.proyectosEliminar
          );


          this.cargandoPermisos.set(false);


          if (
            permisos.proyectosVer
          ) {

            this.cargarProyectos();

          }

        },


        error: (error: any) => {

          console.error(
            'ERROR CARGANDO PERMISOS:',
            error
          );


          this.cargandoPermisos.set(false);

          this.puedeVer.set(false);

          this.puedeCrear.set(false);

          this.puedeEditar.set(false);

          this.puedeEliminar.set(false);


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


  // =====================================================
  // CARGAR CLIENTES
  // =====================================================

  cargarClientes(): void {

    this.cargandoClientes.set(true);

    this.clienteService
      .obtenerTodos()
      .subscribe({

        next: (clientes: Cliente[]) => {

          this.clientes = clientes;

          this.cargandoClientes.set(false);

        },


        error: (error: any) => {

          console.error(
            'ERROR CARGANDO CLIENTES:',
            error
          );

          this.cargandoClientes.set(false);

          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudieron cargar los clientes.'

          });

        }

      });

  }


  // =====================================================
  // CARGAR PROYECTOS
  // =====================================================

  cargarProyectos(): void {

    if (!this.puedeVer()) {

      return;

    }


    this.cargando.set(true);


    this.proyectoService
      .obtenerTodos()
      .subscribe({

        next: (data: Proyecto[]) => {

          this.proyectos.set(data);

          this.cargando.set(false);

        },


        error: (error: any) => {

          console.error(
            'ERROR CARGANDO PROYECTOS:',
            error
          );


          this.cargando.set(false);


          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudieron cargar los proyectos'

          });

        }

      });

  }


  // =====================================================
  // NUEVO PROYECTO
  // =====================================================

  abrirNuevo(): void {

    if (!this.puedeCrear()) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para crear proyectos.'

      });

      return;

    }


    this.modoEdicion.set(false);

    this.proyectoActual =
      this.formularioVacio();

    this.idEnEdicion = null;

    this.dialogoVisible.set(true);

  }


  // =====================================================
  // EDITAR PROYECTO
  // =====================================================

  abrirEdicion(
    proyecto: Proyecto
  ): void {

    if (!this.puedeEditar()) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para editar proyectos.'

      });

      return;

    }


    this.modoEdicion.set(true);

    this.idEnEdicion = proyecto.id;


    this.proyectoActual = {

      nombre:
        proyecto.nombre,

      descripcion:
        proyecto.descripcion ?? '',

      cliente:
        proyecto.cliente,

      ubicacion:
        proyecto.ubicacion,

      estado:
        proyecto.estado,

      latitud:
        proyecto.latitud ?? null,

      longitud:
        proyecto.longitud ?? null,

      clienteId:
        proyecto.clienteId ?? null

    };


    this.dialogoVisible.set(true);

  }


  // =====================================================
  // GUARDAR
  // =====================================================

  guardar(): void {


    // ---------------------------------------------------
    // VALIDAR PERMISO EDICIÓN
    // ---------------------------------------------------

    if (

      this.modoEdicion() &&

      !this.puedeEditar()

    ) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para editar proyectos.'

      });

      return;

    }


    // ---------------------------------------------------
    // VALIDAR PERMISO CREACIÓN
    // ---------------------------------------------------

    if (

      !this.modoEdicion() &&

      !this.puedeCrear()

    ) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para crear proyectos.'

      });

      return;

    }


    // ---------------------------------------------------
    // LIMPIAR DATOS
    // ---------------------------------------------------

    const nombre =
      this.proyectoActual.nombre?.trim();

    const clienteId =
      this.proyectoActual.clienteId;

    const ubicacion =
      this.proyectoActual.ubicacion?.trim();


    // ---------------------------------------------------
    // BUSCAR CLIENTE SELECCIONADO
    // ---------------------------------------------------

    const clienteSeleccionado =
      this.clientes.find(
        cliente =>
          cliente.id === clienteId
      );


    const cliente =
      clienteSeleccionado?.nombre?.trim() ||
      this.proyectoActual.cliente?.trim();


    // ---------------------------------------------------
    // VALIDAR CAMPOS
    // ---------------------------------------------------

    if (
      !nombre ||
      !clienteId ||
      !ubicacion
    ) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Faltan datos',

        detail:
          !clienteId
            ? 'El cliente es obligatorio.'
            : 'Completa los campos obligatorios.'

      });

      return;

    }


    // ---------------------------------------------------
    // DATOS A ENVIAR
    // ---------------------------------------------------

    const datos: ProyectoRequest = {

      nombre,

      descripcion:
        this.proyectoActual.descripcion?.trim() || '',

      cliente,

      ubicacion,

      estado:
        this.proyectoActual.estado ||
        'EN_PROGRESO',

      latitud:
        this.proyectoActual.latitud ?? null,

      longitud:
        this.proyectoActual.longitud ?? null,

      clienteId

    };


    console.log(
      'DATOS PROYECTO A ENVIAR:',
      datos
    );


    // ---------------------------------------------------
    // CREAR / ACTUALIZAR
    // ---------------------------------------------------

    const peticion =

      this.modoEdicion() &&
      this.idEnEdicion !== null

        ? this.proyectoService.actualizar(

            this.idEnEdicion,

            datos

          )

        : this.proyectoService.crear(

            datos

          );


    // ---------------------------------------------------
    // RESPUESTA
    // ---------------------------------------------------

    peticion.subscribe({

      next: (_proyecto: Proyecto) => {

        this.messageService.add({

          severity: 'success',

          summary: 'Éxito',

          detail:
            this.modoEdicion()

              ? 'Proyecto actualizado correctamente.'

              : 'Proyecto creado correctamente.'

        });


        this.dialogoVisible.set(false);


        this.cargarProyectos();

      },


      error: (error: any) => {

        console.error(
          'ERROR GUARDANDO PROYECTO:',
          error
        );


        this.messageService.add({

          severity: 'error',

          summary: 'Error',

          detail:
            error?.error?.error ||
            'No se pudo guardar el proyecto.'

        });

      }

    });

  }


  // =====================================================
  // CONFIRMAR ELIMINACIÓN
  // =====================================================

  confirmarEliminar(
    proyecto: Proyecto
  ): void {

    if (!this.puedeEliminar()) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para eliminar proyectos.'

      });

      return;

    }


    this.confirmationService.confirm({

      message:
        `¿Seguro que quieres eliminar "${proyecto.nombre}"?`,

      header:
        'Confirmar eliminación',

      icon:
        'pi pi-exclamation-triangle',

      accept: () =>
        this.eliminar(proyecto.id)

    });

  }


  // =====================================================
  // ELIMINAR
  // =====================================================

  eliminar(
    id: number
  ): void {

    if (!this.puedeEliminar()) {

      return;

    }


    this.proyectoService
      .eliminar(id)
      .subscribe({

        next: (_respuesta: any) => {

          this.messageService.add({

            severity: 'success',

            summary: 'Eliminado',

            detail:
              'Proyecto eliminado correctamente.'

          });


          this.cargarProyectos();

        },


        error: (error: any) => {

          console.error(
            'ERROR ELIMINANDO PROYECTO:',
            error
          );


          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudo eliminar el proyecto.'

          });

        }

      });

  }


  // =====================================================
  // VER PUNTOS
  // =====================================================

  verPuntos(
    proyecto: Proyecto
  ): void {

    if (!this.puedeVer()) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para consultar proyectos.'

      });

      return;

    }


    this.router.navigate([

      '/proyectos',

      proyecto.id,

      'puntos'

    ]);

  }


  // =====================================================
  // SEVERIDAD ESTADO
  // =====================================================

  severidadEstado(

    estado: string

  ): 'success' | 'info' | 'warn' | 'danger' {

    switch (estado) {

      case 'FINALIZADO':

        return 'success';


      case 'EN_PROGRESO':

        return 'info';


      case 'PAUSADO':

        return 'warn';


      case 'CANCELADO':

        return 'danger';


      default:

        return 'info';

    }

  }


  // =====================================================
  // FORMULARIO VACÍO
  // =====================================================

  private formularioVacio(): ProyectoRequest {

    return {

      nombre: '',

      descripcion: '',

      cliente: '',

      ubicacion: '',

      estado: 'EN_PROGRESO',

      latitud: null,

      longitud: null,

      clienteId: null

    };

  }

}
