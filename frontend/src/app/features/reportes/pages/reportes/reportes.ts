import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Proyecto } from '../../../../core/models/proyecto.model';
import { ProyectoService } from '../../../../core/services/proyecto.service';

import { Levantamiento } from '../../../levantamientos/models/levantamiento';
import { LevantamientosService } from '../../../levantamientos/services/levantamientos';

import { Equipo } from '../../../equipos/models/equipo';
import { EquiposService } from '../../../equipos/services/equipos';

import { environment } from '../../../../environments/environment';

import { AuthService } from '../../../../core/services/auth.service';

import {
  PermisoService,
  PermisosUsuario
} from '../../../../core/services/permiso.service';


interface ReporteProyecto {

  proyecto: {
    id: number;
    nombre: string;
    descripcion: string | null;
    cliente: string;
    ubicacion: string;
    estado: string;
    fechaInicio: string;
    fechaFin: string | null;
    latitud: number | null;
    longitud: number | null;
  };

  responsable: {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
    empresa: string | null;
    profesion: string | null;
  };

  estadisticas: {
    totalPuntos: number;
    totalLevantamientos: number;
    totalEquipos: number;
    totalArchivos: number;
    elevacionMinima: number | null;
    elevacionMaxima: number | null;
    elevacionPromedio: number | null;
    puntosPorTipo: Record<string, number>;
    levantamientosPorEstado: Record<string, number>;
  };

  puntos: PuntoReporte[];
  levantamientos: LevantamientoReporte[];
  equipos: EquipoReporte[];
  archivos: ArchivoReporte[];
}


interface PuntoReporte {

  id: number;
  codigo: string;
  norte: number;
  este: number;
  elevacion: number;
  descripcion: string | null;
  tipo: string | null;
  precision: number | null;
  equipo: string | null;
  metodo: string | null;
  observaciones: string | null;
  latitud: number | null;
  longitud: number | null;
  createdAt: string;

}


interface LevantamientoReporte {

  id: number;
  fecha: string;
  descripcion: string | null;
  observaciones: string | null;
  estado: string;

  equipo: {
    id: number;
    nombre: string;
    tipo: string;
    marca: string | null;
    modelo: string | null;
  } | null;

  responsable: {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
  };

}


interface EquipoReporte {

  id: number;
  nombre: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  estado: string;
  fechaCompra: string | null;

}


interface ArchivoReporte {

  id: number;
  nombre: string;
  url: string;
  tipo: string;
  createdAt: string;

}


@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {

  private proyectoService =
    inject(ProyectoService);

  private levantamientosService =
    inject(LevantamientosService);

  private equiposService =
    inject(EquiposService);

  private http =
    inject(HttpClient);

  private authService =
    inject(AuthService);

  private permisoService =
    inject(PermisoService);

  private cdr =
    inject(ChangeDetectorRef);


  private readonly REPORTES_URL =
    `${environment.apiUrl}/reportes`;


  // =====================================================
  // DATOS
  // =====================================================

  proyectos: Proyecto[] = [];

  levantamientos: Levantamiento[] = [];

  equipos: Equipo[] = [];

  reporteProyecto: ReporteProyecto | null = null;

  proyectoSeleccionadoId: number | null = null;


  // =====================================================
  // ESTADOS
  // =====================================================

  cargando = true;

  cargandoReporte = false;

  cargandoPermisos = true;

  puedeVer = false;

  permisos: PermisosUsuario | null = null;

  error = '';

  descargando: number | null = null;


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

      return;
    }


    // -------------------------------------------------
    // ADMIN → ACCESO TOTAL
    // -------------------------------------------------

    if (usuario.rol === 'ADMIN') {

      this.puedeVer = true;

      this.cargandoPermisos = false;

      this.cargarDatos();

      return;
    }


    // -------------------------------------------------
    // USUARIO → SUS PROPIOS PERMISOS
    // -------------------------------------------------

    this.permisoService
      .obtenerMisPermisos()
      .subscribe({

        next: (permisos) => {

          this.permisos = permisos;

          this.puedeVer =
            permisos.reportesVer;

          this.cargandoPermisos = false;


          if (this.puedeVer) {

            this.cargarDatos();

          }


          this.cdr.detectChanges();

        },

        error: (error: any) => {

          console.error(
            'Error cargando permisos de reportes:',
            error
          );

          this.puedeVer = false;

          this.cargandoPermisos = false;

          this.error =
            error?.error?.error ||
            'No se pudieron cargar los permisos.';

          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // CARGAR INFORMACIÓN GENERAL
  // =====================================================

  cargarDatos(): void {

    if (!this.puedeVer) {
      return;
    }


    this.cargando = true;
    this.error = '';


    let proyectosCargados = false;

    let levantamientosCargados = false;

    let equiposCargados = false;


    const comprobarCarga = () => {

      if (
        proyectosCargados &&
        levantamientosCargados &&
        equiposCargados
      ) {

        this.cargando = false;

        this.cdr.detectChanges();

      }

    };


    // =================================================
    // PROYECTOS
    // =================================================

    this.proyectoService
      .obtenerTodos()
      .subscribe({

        next: (data) => {

          this.proyectos = data;

          proyectosCargados = true;

          comprobarCarga();

        },

        error: (error) => {

          console.error(
            'Error cargando proyectos:',
            error
          );

          this.error =
            'No se pudieron cargar los proyectos';

          proyectosCargados = true;

          comprobarCarga();

        }

      });


    // =================================================
    // LEVANTAMIENTOS
    // =================================================

    this.levantamientosService
      .obtenerLevantamientos()
      .subscribe({

        next: (data) => {

          this.levantamientos = data;

          levantamientosCargados = true;

          comprobarCarga();

        },

        error: (error) => {

          console.error(
            'Error cargando levantamientos:',
            error
          );

          this.error =
            'No se pudieron cargar los levantamientos';

          levantamientosCargados = true;

          comprobarCarga();

        }

      });


    // =================================================
    // EQUIPOS
    // =================================================

    this.equiposService
      .obtenerEquipos()
      .subscribe({

        next: (data) => {

          this.equipos = data;

          equiposCargados = true;

          comprobarCarga();

        },

        error: (error) => {

          console.error(
            'Error cargando equipos:',
            error
          );

          this.error =
            'No se pudieron cargar los equipos';

          equiposCargados = true;

          comprobarCarga();

        }

      });

  }


  // =====================================================
  // SELECCIONAR PROYECTO
  // =====================================================

  seleccionarProyecto(
    proyectoId: number | string
  ): void {

    if (!this.puedeVer) {

      this.error =
        'No tienes permiso para consultar reportes.';

      return;

    }


    const id =
      Number(proyectoId);


    if (!id) {

      this.proyectoSeleccionadoId = null;

      this.reporteProyecto = null;

      return;

    }


    this.proyectoSeleccionadoId = id;

    this.cargarReporteProyecto(id);

  }


  // =====================================================
  // CARGAR REPORTE TÉCNICO
  // =====================================================

  cargarReporteProyecto(
    proyectoId: number
  ): void {

    if (!this.puedeVer) {

      return;

    }


    this.cargandoReporte = true;

    this.error = '';


    const headers =
      new HttpHeaders({

        'Cache-Control':
          'no-cache, no-store, must-revalidate',

        'Pragma':
          'no-cache'

      });


    this.http
      .get<ReporteProyecto>(
        `${this.REPORTES_URL}/proyecto/${proyectoId}`,
        {
          headers
        }
      )
      .subscribe({

        next: (reporte) => {

          if (
            this.proyectoSeleccionadoId !== proyectoId
          ) {

            return;

          }

          this.reporteProyecto =
            reporte;

          this.cargandoReporte =
            false;

          this.cdr.detectChanges();

        },

        error: (error) => {

          if (
            this.proyectoSeleccionadoId !== proyectoId
          ) {

            return;

          }

          console.error(
            'Error cargando reporte técnico:',
            error
          );

          this.reporteProyecto = null;

          this.error =
            error?.error?.error ||
            'No se pudo cargar el reporte técnico';

          this.cargandoReporte =
            false;

          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  get totalProyectos(): number {

    return this.proyectos.length;

  }


  get totalLevantamientos(): number {

    return this.levantamientos.length;

  }


  get totalEquipos(): number {

    return this.equipos.length;

  }


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


  get completados(): number {

    return this.levantamientos.filter(
      l => l.estado === 'COMPLETADO'
    ).length;

  }


  // =====================================================
  // UTILIDADES
  // =====================================================

  nombreProyecto(
    id: number
  ): string {

    return this.proyectos.find(
      p => p.id === id
    )?.nombre || '-';

  }


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


  nombreResponsable(
    levantamiento: Levantamiento
  ): string {

    if (levantamiento.responsable) {

      return `${levantamiento.responsable.nombre} ${levantamiento.responsable.apellido}`;

    }

    return '-';

  }


  formatearNumero(
    valor: number | null | undefined,
    decimales = 3
  ): string {

    if (
      valor === null ||
      valor === undefined ||
      !Number.isFinite(
        Number(valor)
      )
    ) {

      return '-';

    }


    return Number(valor)
      .toFixed(decimales);

  }


  // =====================================================
  // DESCARGAR MEMORIA PDF
  // =====================================================

  descargarMemoriaPDF(
    proyecto: {
      id: number;
      nombre: string;
    }
  ): void {

    if (!this.puedeVer) {

      this.error =
        'No tienes permiso para generar reportes.';

      return;

    }


    this.descargarArchivo(

      `${this.REPORTES_URL}/memoria-calculo/${proyecto.id}/pdf`,

      `memoria_calculo_${proyecto.nombre}.pdf`,

      proyecto.id

    );

  }


  // =====================================================
  // DESCARGAR MEMORIA EXCEL
  // =====================================================

  descargarMemoriaExcel(
    proyecto: {
      id: number;
      nombre: string;
    }
  ): void {

    if (!this.puedeVer) {

      this.error =
        'No tienes permiso para generar reportes.';

      return;

    }


    this.descargarArchivo(

      `${this.REPORTES_URL}/memoria-calculo/${proyecto.id}/excel`,

      `memoria_calculo_${proyecto.nombre}.xlsx`,

      proyecto.id

    );

  }


  // =====================================================
  // DESCARGAR ARCHIVO
  // =====================================================

  private descargarArchivo(
    url: string,
    nombreArchivo: string,
    proyectoId: number
  ): void {

    if (!this.puedeVer) {

      return;

    }


    this.descargando =
      proyectoId;

    this.error = '';


    this.http
      .get(url, {
        responseType: 'blob'
      })
      .subscribe({

        next: (blob: Blob) => {

          const urlBlob =
            window.URL.createObjectURL(
              blob
            );

          const enlace =
            document.createElement('a');

          enlace.href =
            urlBlob;

          enlace.download =
            nombreArchivo;

          enlace.click();

          window.URL.revokeObjectURL(
            urlBlob
          );

          this.descargando =
            null;

        },

        error: (error) => {

          console.error(
            'Error al descargar el reporte:',
            error
          );

          this.error =
            error?.error?.error ||
            'No se pudo generar el reporte';

          this.descargando =
            null;

        }

      });

  }

}
