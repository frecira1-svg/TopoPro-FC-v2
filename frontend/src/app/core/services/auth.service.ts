import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  Usuario,
  AuthResponse,
  LoginRequest,
  RegistroRequest
} from '../models/usuario.model';

import { environment } from '../../environments/environment';

import {
  PermisoService,
  PermisosUsuario
} from './permiso';


@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API_URL =
    `${environment.apiUrl}/auth`;

  private readonly TOKEN_KEY =
    'topopro_token';

  private readonly USUARIO_KEY =
    'topopro_usuario';


  usuarioActual =
    signal<Usuario | null>(
      this.obtenerUsuarioGuardado()
    );


  constructor(
    private http: HttpClient,
    private permisoService: PermisoService
  ) {}


  // ==========================================
  // REGISTRO
  // ==========================================

  registrar(
    datos: RegistroRequest
  ): Observable<AuthResponse> {

    return this.http
      .post<AuthResponse>(
        `${this.API_URL}/registro`,
        datos
      )
      .pipe(

        tap(respuesta => {

          this.guardarSesion(respuesta);

          this.cargarPermisos();

        })

      );

  }


  // ==========================================
  // LOGIN
  // ==========================================

  login(
    datos: LoginRequest
  ): Observable<AuthResponse> {

    return this.http
      .post<AuthResponse>(
        `${this.API_URL}/login`,
        datos
      )
      .pipe(

        tap(respuesta => {

          // Guardar sesión
          this.guardarSesion(respuesta);

          // Cargar permisos
          this.cargarPermisos();

        })

      );

  }


  // ==========================================
  // CARGAR PERMISOS
  // ==========================================

  private cargarPermisos(): void {

    this.permisoService
      .obtenerMisPermisos()
      .subscribe({

        next: permisos => {

          console.log(
            'Permisos cargados:',
            permisos
          );

          this.permisoService
            .establecerPermisos(permisos);

        },

        error: error => {

          console.error(
            'Error cargando permisos:',
            error
          );

        }

      });

  }


  // ==========================================
  // PERFIL
  // ==========================================

  obtenerPerfil():
    Observable<{ usuario: Usuario }> {

    return this.http.get<{ usuario: Usuario }>(
      `${this.API_URL}/perfil`
    );

  }


  // ==========================================
  // ACTUALIZAR PERFIL
  // ==========================================

  actualizarPerfil(
    datos: Partial<Usuario>
  ): Observable<{ usuario: Usuario }> {

    return this.http
      .put<{ usuario: Usuario }>(
        `${this.API_URL}/perfil`,
        datos
      )
      .pipe(

        tap(respuesta => {

          this.actualizarUsuarioLocal(
            respuesta.usuario
          );

        })

      );

  }


  // ==========================================
  // SUBIR FOTO
  // ==========================================

  subirFoto(
    archivo: File
  ): Observable<{ usuario: Usuario }> {

    const formData = new FormData();

    formData.append(
      'foto',
      archivo
    );


    return this.http
      .put<{ usuario: Usuario }>(
        `${this.API_URL}/perfil/foto`,
        formData
      )
      .pipe(

        tap(respuesta => {

          this.actualizarUsuarioLocal(
            respuesta.usuario
          );

        })

      );

  }


  // ==========================================
  // CAMBIAR PASSWORD
  // ==========================================

  cambiarPassword(
    datos: {
      passwordActual: string;
      passwordNueva: string;
    }
  ): Observable<{ mensaje: string }> {

    return this.http.put<{ mensaje: string }>(
      `${this.API_URL}/perfil/password`,
      datos
    );

  }


  // ==========================================
  // LOGOUT
  // ==========================================

  logout(): void {

    localStorage.removeItem(
      this.TOKEN_KEY
    );

    localStorage.removeItem(
      this.USUARIO_KEY
    );

    this.permisoService.limpiar();

    this.usuarioActual.set(null);

  }


  // ==========================================
  // TOKEN
  // ==========================================

  obtenerToken(): string | null {

    return localStorage.getItem(
      this.TOKEN_KEY
    );

  }


  // ==========================================
  // AUTENTICACIÓN
  // ==========================================

  estaAutenticado(): boolean {

    return !!this.obtenerToken();

  }


  // ==========================================
  // GUARDAR SESIÓN
  // ==========================================

  private guardarSesion(
    respuesta: AuthResponse
  ): void {

    localStorage.setItem(
      this.TOKEN_KEY,
      respuesta.token
    );

    localStorage.setItem(
      this.USUARIO_KEY,
      JSON.stringify(
        respuesta.usuario
      )
    );

    this.usuarioActual.set(
      respuesta.usuario
    );

  }


  // ==========================================
  // ACTUALIZAR USUARIO LOCAL
  // ==========================================

  private actualizarUsuarioLocal(
    usuario: Usuario
  ): void {

    localStorage.setItem(
      this.USUARIO_KEY,
      JSON.stringify(usuario)
    );

    this.usuarioActual.set(
      usuario
    );

  }


  // ==========================================
  // OBTENER USUARIO GUARDADO
  // ==========================================

  private obtenerUsuarioGuardado():
    Usuario | null {

    const data =
      localStorage.getItem(
        this.USUARIO_KEY
      );

    return data
      ? JSON.parse(data)
      : null;

  }

}
