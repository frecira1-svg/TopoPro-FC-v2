import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PermisoService {

  private apiUrl = 'http://localhost:3000/api/permisos';

  private permisos: PermisosUsuario | null = null;

  constructor(
    private http: HttpClient
  ) {}

  // ==========================================
  // OBTENER MIS PERMISOS
  // ==========================================

  obtenerMisPermisos(): Observable<PermisosUsuario> {

    return this.http.get<PermisosUsuario>(
      `${this.apiUrl}/mios`
    );

  }


  // ==========================================
  // GUARDAR PERMISOS EN MEMORIA
  // ==========================================

  establecerPermisos(
    permisos: PermisosUsuario
  ): void {

    this.permisos = permisos;

  }


  // ==========================================
  // OBTENER PERMISOS ACTUALES
  // ==========================================

  obtenerPermisosActuales(): PermisosUsuario | null {

    return this.permisos;

  }


  // ==========================================
  // VERIFICAR PERMISO
  // ==========================================

  tienePermiso(
    nombrePermiso: keyof PermisosUsuario
  ): boolean {

    if (!this.permisos) {
      return false;
    }

    return Boolean(
      this.permisos[nombrePermiso]
    );

  }


  // ==========================================
  // LIMPIAR PERMISOS
  // ==========================================

  limpiar(): void {

    this.permisos = null;

  }

}
