import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';


// =====================================================
// USUARIO RESUMEN
// =====================================================

export interface UsuarioResumen {

  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;

}


// =====================================================
// PERMISOS DE USUARIO
// =====================================================

export interface PermisosUsuario {

  id: number;
  usuarioId: number;

  proyectosVer: boolean;
  proyectosCrear: boolean;
  proyectosEditar: boolean;
  proyectosEliminar: boolean;

  levantamientosVer: boolean;
  levantamientosCrear: boolean;
  levantamientosEditar: boolean;
  levantamientosEliminar: boolean;

  equiposVer: boolean;
  equiposCrear: boolean;
  equiposEditar: boolean;
  equiposEliminar: boolean;

  reportesVer: boolean;
  reportesCrear: boolean;
  reportesEditar: boolean;
  reportesEliminar: boolean;

  mapasVer: boolean;

  clientesVer: boolean;
  clientesCrear: boolean;
  clientesEditar: boolean;
  clientesEliminar: boolean;

  createdAt: string;
  updatedAt: string;

}


// =====================================================
// SERVICIO
// =====================================================

@Injectable({
  providedIn: 'root'
})
export class PermisoService {

  private http = inject(HttpClient);


  private readonly API_URL =
    `${environment.apiUrl}/permisos`;


  private readonly headersNoCache =
    new HttpHeaders({

      'Cache-Control':
        'no-cache, no-store, must-revalidate',

      'Pragma':
        'no-cache',

      'Expires':
        '0'

    });


  // ===================================================
  // USUARIOS
  // SOLO ADMIN
  // ===================================================

  obtenerUsuarios():
    Observable<UsuarioResumen[]> {

    return this.http.get<UsuarioResumen[]>(
      `${this.API_URL}/usuarios`,
      {
        headers: this.headersNoCache
      }
    );

  }


  // ===================================================
  // MIS PROPIOS PERMISOS
  // ===================================================

  obtenerMisPermisos():
    Observable<PermisosUsuario> {

    return this.http.get<PermisosUsuario>(
      `${this.API_URL}/mios`,
      {
        headers: this.headersNoCache
      }
    );

  }


  // ===================================================
  // PERMISOS DE UN USUARIO
  // SOLO ADMIN
  // ===================================================

  obtenerPermisos(
    usuarioId: number
  ): Observable<PermisosUsuario> {

    return this.http.get<PermisosUsuario>(
      `${this.API_URL}/${usuarioId}`,
      {
        headers: this.headersNoCache
      }
    );

  }


  // ===================================================
  // ACTUALIZAR PERMISOS
  // ===================================================

  actualizarPermisos(
    usuarioId: number,
    datos: Partial<PermisosUsuario>
  ): Observable<PermisosUsuario> {

    return this.http.put<PermisosUsuario>(
      `${this.API_URL}/${usuarioId}`,
      datos,
      {
        headers: this.headersNoCache
      }
    );

  }


  // ===================================================
  // VERIFICAR PERMISO
  // ===================================================

  tienePermiso(
    permisos: PermisosUsuario | null,
    permiso: keyof PermisosUsuario
  ): boolean {

    if (!permisos) {
      return false;
    }

    return permisos[permiso] === true;

  }


  // ===================================================
  // VERIFICAR VARIOS PERMISOS
  // ===================================================

  tieneAlgunPermiso(
    permisos: PermisosUsuario | null,
    permisosRequeridos: (keyof PermisosUsuario)[]
  ): boolean {

    if (!permisos) {
      return false;
    }

    return permisosRequeridos.some(
      permiso =>
        permisos[permiso] === true
    );

  }


  // ===================================================
  // VERIFICAR TODOS LOS PERMISOS
  // ===================================================

  tieneTodosLosPermisos(
    permisos: PermisosUsuario | null,
    permisosRequeridos: (keyof PermisosUsuario)[]
  ): boolean {

    if (!permisos) {
      return false;
    }

    return permisosRequeridos.every(
      permiso =>
        permisos[permiso] === true
    );

  }

}
