import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReporteProyecto {
  proyecto: {
    id: number;
    nombre: string;
    descripcion: string | null;
    cliente: string | null;
    ubicacion: string | null;
    estado: string;
    fechaInicio: string | null;
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
  } | null;

  estadisticas: {
    totalPuntos: number;
    totalLevantamientos: number;
    totalEquipos: number;
    totalArchivos: number;
    elevacionMinima: number | null;
    elevacionMaxima: number | null;
    elevacionPromedio: number | null;
    puntosPorTipo: {
      [key: string]: number;
    };
    levantamientosPorEstado: {
      [key: string]: number;
    };
  };

  puntos: any[];
  levantamientos: any[];
  equipos: any[];
  archivos: any[];
}


@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  private apiUrl = `${environment.apiUrl}/reportes`;

  constructor(
    private http: HttpClient
  ) {}


  // ==========================================
  // REPORTE JSON
  // ==========================================

  obtenerReporteProyecto(
    proyectoId: number
  ): Observable<ReporteProyecto> {

    return this.http.get<ReporteProyecto>(
      `${this.apiUrl}/proyecto/${proyectoId}`
    );

  }


  // ==========================================
  // PDF
  // ==========================================

  descargarPDF(
    proyectoId: number
  ): Observable<Blob> {

    return this.http.get(
      `${this.apiUrl}/memoria-calculo/${proyectoId}/pdf`,
      {
        responseType: 'blob'
      }
    );

  }


  // ==========================================
  // EXCEL
  // ==========================================

  descargarExcel(
    proyectoId: number
  ): Observable<Blob> {

    return this.http.get(
      `${this.apiUrl}/memoria-calculo/${proyectoId}/excel`,
      {
        responseType: 'blob'
      }
    );

  }

}
