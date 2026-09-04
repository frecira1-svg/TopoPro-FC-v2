import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { PublicacionDialog } from '../../components/publicacion-dialog/publicacion-dialog';
import { PublicacionDetalle } from '../../components/publicacion-detalle/publicacion-detalle';
import { PublicacionService } from '../../../../core/services/publicacion.service';
import { AuthService } from '../../../../core/services/auth.service';

import {
    Publicacion,
    PublicacionRequest,
    TipoPublicacion,
    ComentarioRequest
} from '../../../../core/models/publicacion.model';

@Component({

    selector: 'app-publicaciones',

    standalone: true,

    imports: [

    CommonModule,

    RouterLink,

    ToastModule,

    PublicacionCard,

    PublicacionDialog,

    PublicacionDetalle

],

    providers: [MessageService],

    templateUrl: './publicaciones.html',

    styleUrl: './publicaciones.css'

})

export class Publicaciones implements OnInit {

    publicaciones = signal<Publicacion[]>([]);

    cargando = signal(false);

    dialogoVisible = signal(false);

    detalleVisible = signal(false);

publicacionDetalle = signal<Publicacion | null>(null);

    modoEdicion = signal(false);

    filtro = signal<'TODAS' | 'NOTICIA' | 'COMUNIDAD'>('TODAS');

    publicacionActual: PublicacionRequest = this.formularioVacio();

    idEnEdicion: number | null = null;

    usuario = computed(() => this.authService.usuarioActual());

    publicacionesFiltradas = computed(() => {

        const lista = this.publicaciones();

        const tipo = this.filtro();

        if (tipo === 'TODAS') {

            return lista;

        }

        return lista.filter(

            p => p.tipo === tipo

        );

    });

    constructor(

        private publicacionService: PublicacionService,

        private authService: AuthService,

        private messageService: MessageService

    ) {}

    ngOnInit(): void {

        this.cargarPublicaciones();

    }

    cargarPublicaciones(): void {

    this.cargando.set(true);

    const tipo: TipoPublicacion | undefined =
        this.filtro() === 'TODAS'
            ? undefined
            : this.filtro() as TipoPublicacion;


    this.publicacionService
        .obtenerPublicaciones(tipo)
        .subscribe({

            next: (publicaciones: Publicacion[]) => {

                this.publicaciones.set(publicaciones);

                this.cargando.set(false);

            },

            error: (error: any) => {

                console.error(
                    'Error cargando publicaciones:',
                    error
                );

                this.cargando.set(false);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error?.error?.error || 'No se pudieron cargar las publicaciones.'
                });

            }

        });

}

    cambiarFiltro(

        tipo: 'TODAS' | 'NOTICIA' | 'COMUNIDAD'

    ): void {

        this.filtro.set(tipo);

        this.cargarPublicaciones();

    }

    abrirNuevaPublicacion(): void {

        this.modoEdicion.set(false);

        this.idEnEdicion = null;

        this.publicacionActual = this.formularioVacio();

        this.dialogoVisible.set(true);

    }

    editarPublicacion(

        publicacion: Publicacion

    ): void {

        this.modoEdicion.set(true);

        this.idEnEdicion = publicacion.id;

        this.publicacionActual = {

            titulo: publicacion.titulo,

            contenido: publicacion.contenido,

            tipo: publicacion.tipo,

            imagen: publicacion.imagen,
            tipoTrabajo: publicacion.tipoTrabajo ?? '',
            ubicacion: publicacion.ubicacion ?? '',
            etiquetas: publicacion.etiquetas ?? ''

        };

        this.dialogoVisible.set(true);

    }

   cerrarDialogo(): void {

    this.idEnEdicion = null;

    this.dialogoVisible.set(false);

}

cerrarDetalle(): void {

    this.detalleVisible.set(false);

    this.publicacionDetalle.set(null);

}

guardarPublicacion(
    datos: PublicacionRequest
): void {

        const esEdicion = this.modoEdicion() && this.idEnEdicion;

        const peticion =

            esEdicion

                ? this.publicacionService.actualizarPublicacion(
                    this.idEnEdicion!,
                    datos
                )

                : this.publicacionService.crearPublicacion(
                    datos
                );

        peticion.subscribe({

            next: () => {

                this.dialogoVisible.set(false);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: esEdicion
                        ? 'Publicación actualizada correctamente.'
                        : 'Publicación creada correctamente.'
                });

                this.cargarPublicaciones();

            },

            error: error => {

                console.error(error);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error?.error?.error || 'No se pudo guardar la publicación.'
                });

            }

        });

    }



    eliminarPublicacion(
        publicacion: Publicacion
    ): void {

        if (

            !confirm(

                `¿Deseas eliminar la publicación "${publicacion.titulo}"?`

            )

        ) {

            return;

        }

        this.publicacionService

            .eliminarPublicacion(publicacion.id)

            .subscribe({

                next: () => {

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Eliminada',
                        detail: 'Publicación eliminada correctamente.'
                    });

                    this.cargarPublicaciones();

                },

                error: error => {

                    console.error(error);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error?.error?.error || 'No se pudo eliminar la publicación.'
                    });

                }

            });

    }



   abrirDetalle(
    publicacion: Publicacion
): void {

    this.publicacionService
        .obtenerPublicacion(publicacion.id)
        .subscribe({

            next: (respuesta: Publicacion) => {

                this.publicacionDetalle.set(respuesta);

                this.detalleVisible.set(true);

            },

            error: (error: any) => {

                console.error(error);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error?.error?.error || 'No se pudo abrir la publicación.'
                });

            }

        });

}

crearComentario(
    datos: ComentarioRequest
): void {

    const publicacion = this.publicacionDetalle();

    if (!publicacion) {

        return;

    }

    this.publicacionService
        .crearComentario(
            publicacion.id,
            datos
        )
        .subscribe({

            next: () => {

                this.abrirDetalle(publicacion);

                this.cargarPublicaciones();

            },

            error: (error: any) => {

                console.error(error);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error?.error?.error || 'No se pudo publicar el comentario.'
                });

            }

        });

}

eliminarComentario(
    comentarioId: number
): void {

    const publicacion = this.publicacionDetalle();

    if (!publicacion) {

        return;

    }

    this.publicacionService
        .eliminarComentario(comentarioId)
        .subscribe({

            next: () => {

                this.abrirDetalle(publicacion);

                this.cargarPublicaciones();

            },

            error: (error: any) => {

                console.error(error);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error?.error?.error || 'No se pudo eliminar el comentario.'
                });

            }

        });

}


    private formularioVacio():

        PublicacionRequest {

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
