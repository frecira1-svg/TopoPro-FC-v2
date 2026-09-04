import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { Cliente } from '../../models/cliente';
import { ClientesService } from '../../services/clientes';

import { AuthService } from '../../../../core/services/auth.service';
import {
  PermisoService,
  PermisosUsuario
} from '../../../../core/services/permiso.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class Clientes implements OnInit {

  private clientesService = inject(ClientesService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  private authService = inject(AuthService);
  private permisoService = inject(PermisoService);


  // =====================================================
  // CLIENTES
  // =====================================================

  clientes: Cliente[] = [];

  cargando = true;


  // =====================================================
  // FORMULARIO
  // =====================================================

  mostrarFormulario = false;

  editando = false;

  clienteId: number | null = null;


  formulario: FormGroup = this.fb.group({

    nombre: ['', Validators.required],

    nit: [''],

    telefono: [''],

    correo: ['', Validators.email],

    direccion: [''],

    ciudad: [''],

    contacto: ['']

  });


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
  // ESTADÍSTICAS
  // =====================================================

  get ciudadesUnicas(): number {

    return new Set(
      this.clientes
        .map(c => c.ciudad)
        .filter(c => !!c)
    ).size;

  }


  get contactosRegistrados(): number {

    return this.clientes.filter(
      c => !!c.contacto
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
    // ADMINISTRADOR
    // =================================================

    if (usuario.rol === 'ADMIN') {

      this.puedeVer = true;
      this.puedeCrear = true;
      this.puedeEditar = true;
      this.puedeEliminar = true;

      this.cargandoPermisos = false;

      this.cargarClientes();

      return;

    }


    // =================================================
    // USUARIO NORMAL
    // =================================================

    this.permisoService
      .obtenerMisPermisos()
      .subscribe({

        next: (permisos) => {

          this.permisos = permisos;


          this.puedeVer =
            permisos.clientesVer ?? false;


          this.puedeCrear =
            permisos.clientesCrear ?? false;


          this.puedeEditar =
            permisos.clientesEditar ?? false;


          this.puedeEliminar =
            permisos.clientesEliminar ?? false;


          this.cargandoPermisos = false;


          // -------------------------------------------
          // SOLAMENTE CARGAR SI PUEDE VER
          // -------------------------------------------

          if (this.puedeVer) {

            this.cargarClientes();

          } else {

            this.cargando = false;

          }

        },


        error: (error: any) => {

          console.error(
            'ERROR CARGANDO PERMISOS:',
            error
          );


          this.cargandoPermisos = false;

          this.cargando = false;

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

        }

      });

  }


  // =====================================================
  // CARGAR CLIENTES
  // =====================================================

  cargarClientes(): void {

    if (!this.puedeVer) {

      this.cargando = false;

      return;

    }


    this.cargando = true;


    this.clientesService
      .obtenerClientes()
      .subscribe({

        next: (respuesta: Cliente[]) => {

          this.clientes = respuesta;

          this.cargando = false;

        },


        error: (error: any) => {

          console.error(error);

          this.cargando = false;


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
  // NUEVO CLIENTE
  // =====================================================

  nuevoCliente(): void {

    if (!this.puedeCrear) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para crear clientes.'

      });

      return;

    }


    this.editando = false;

    this.clienteId = null;

    this.formulario.reset();

    this.mostrarFormulario = true;

  }


  // =====================================================
  // EDITAR CLIENTE
  // =====================================================

  editarCliente(cliente: Cliente): void {

    if (!this.puedeEditar) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para editar clientes.'

      });

      return;

    }


    this.editando = true;

    this.clienteId =
      cliente.id ?? null;


    this.formulario.patchValue(cliente);

    this.mostrarFormulario = true;

  }


  // =====================================================
  // GUARDAR CLIENTE
  // =====================================================

  guardarCliente(): void {


    // =================================================
    // VALIDAR PERMISO DE EDICIÓN
    // =================================================

    if (
      this.editando &&
      !this.puedeEditar
    ) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para editar clientes.'

      });

      return;

    }


    // =================================================
    // VALIDAR PERMISO DE CREACIÓN
    // =================================================

    if (
      !this.editando &&
      !this.puedeCrear
    ) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para crear clientes.'

      });

      return;

    }


    // =================================================
    // VALIDAR FORMULARIO
    // =================================================

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


    const datos: Cliente =
      this.formulario.value;


    // =================================================
    // ACTUALIZAR
    // =================================================

    if (
      this.editando &&
      this.clienteId
    ) {

      this.clientesService
        .actualizarCliente(
          this.clienteId,
          datos
        )
        .subscribe({

          next: () => {

            this.mostrarFormulario = false;


            this.messageService.add({

              severity: 'success',

              summary: 'Éxito',

              detail:
                'Cliente actualizado correctamente.'

            });


            this.cargarClientes();

          },


          error: (error: any) => {

            console.error(error);


            this.messageService.add({

              severity: 'error',

              summary: 'Error',

              detail:
                error?.error?.error ||
                'No se pudo actualizar el cliente.'

            });

          }

        });


      return;

    }


    // =================================================
    // CREAR
    // =================================================

    this.clientesService
      .crearCliente(datos)
      .subscribe({

        next: () => {

          this.mostrarFormulario = false;


          this.messageService.add({

            severity: 'success',

            summary: 'Éxito',

            detail:
              'Cliente creado correctamente.'

          });


          this.cargarClientes();

        },


        error: (error: any) => {

          console.error(error);


          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudo crear el cliente.'

          });

        }

      });

  }


  // =====================================================
  // ELIMINAR CLIENTE
  // =====================================================

  eliminarCliente(cliente: Cliente): void {

    if (!this.puedeEliminar) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Acceso restringido',

        detail:
          'No tienes permiso para eliminar clientes.'

      });

      return;

    }


    if (!cliente.id) {

      return;

    }


    if (
      !confirm(
        `¿Eliminar el cliente "${cliente.nombre}"?`
      )
    ) {

      return;

    }


    this.clientesService
      .eliminarCliente(cliente.id)
      .subscribe({

        next: () => {

          this.messageService.add({

            severity: 'success',

            summary: 'Eliminado',

            detail:
              'Cliente eliminado correctamente.'

          });


          this.cargarClientes();

        },


        error: (error: any) => {

          console.error(error);


          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudo eliminar el cliente.'

          });

        }

      });

  }


  // =====================================================
  // CANCELAR
  // =====================================================

  cancelar(): void {

    this.mostrarFormulario = false;

    this.formulario.reset();

  }

}
