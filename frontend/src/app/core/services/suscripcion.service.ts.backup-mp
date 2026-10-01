import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ContextoComercial {
  usuarioId: number;
  rol: string;
  esAdmin: boolean;

  plan: {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    precioMensual: number;
    maxProyectos: number | null;
    maxPuntosProyecto: number | null;
    maxUsuarios: number;
    permiteExportacion: boolean;
    permiteOffline: boolean;
    activo: boolean;
  };

  suscripcion: {
    id: number;
    usuarioId: number;
    planId: number;
    estado: string;
    fechaInicio: string;
    fechaFin: string | null;
    proyectoGratisUsado: boolean;
    proveedor: string;
    proveedorClienteId: string | null;
    proveedorSuscripcionId: string | null;
  } | null;

  esFree: boolean;
  puedeExportar: boolean;
  puedeCrearProyecto: boolean;
  puedeAdministrarEquipos: boolean;
}

export interface CrearSuscripcionRequest {
  codigoPlan: string;
}

export interface CrearSuscripcionResponse {
  id?: number;
  estado?: string;
  codigoPlan?: string;
  proveedorSuscripcionId?: string;

  mercadoPago?: {
    id?: string;
    status?: string;
    initPoint?: string;
    preapprovalId?: string;
  };

  [key: string]: unknown;
}

export interface ConfirmarSuscripcionRequest {
  preapprovalId: string;
}

export interface ConfirmarSuscripcionResponse {
  id?: number;
  estado?: string;
  codigoPlan?: string;
  proveedorSuscripcionId?: string;

  mercadoPago?: {
    id?: string;
    status?: string;
    preapprovalId?: string;
  };

  contexto?: ContextoComercial;

  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/comercial`;

  obtenerContextoComercial(): Observable<ContextoComercial> {
    return this.http.get<ContextoComercial>(
      `${this.apiUrl}/`
    );
  }

  crearSuscripcion(
    datos: CrearSuscripcionRequest
  ): Observable<CrearSuscripcionResponse> {

    return this.http.post<CrearSuscripcionResponse>(
      `${this.apiUrl}/suscripciones`,
      datos
    );
  }

  confirmarSuscripcion(
    datos: ConfirmarSuscripcionRequest
  ): Observable<ConfirmarSuscripcionResponse> {

    return this.http.post<ConfirmarSuscripcionResponse>(
      `${this.apiUrl}/suscripciones/confirmar`,
      datos
    );
  }
}
