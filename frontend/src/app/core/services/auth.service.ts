import {
  Injectable,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  tap
} from 'rxjs';

import {
  Usuario,
  AuthResponse,
  LoginRequest,
  RegistroRequest
} from '../models/usuario.model';

import {
  environment
} from '../../environments/environment';

import {
  PermisoService
} from './permiso.service';


// =====================================================
// CONTEXTO COMERCIAL
// =====================================================

export interface ComercialPlan {

  id: number;

  codigo:
    'FREE' |
    'PROFESSIONAL' |
    'COMPANY';

  nombre: string;

  descripcion: string;

  precioMensual: number;

  maxProyectos:
    number | null;

  maxPuntosProyecto:
    number | null;

  maxUsuarios:
    number | null;

  permiteExportacion:
    boolean;

  permiteOffline:
    boolean;

  activo:
    boolean;

}


export interface ComercialSuscripcion {

  id: number;

  usuarioId: number;

  planId: number;

  estado:
    'ACTIVA' |
    'VENCIDA' |
    'CANCELADA' |
    'PENDIENTE';

  fechaInicio:
    string |
    null;

  fechaFin:
    string |
    null;

  plan:
    ComercialPlan;

}


export interface ComercialContexto {

  usuarioId: number;

  rol: string;

  esAdmin: boolean;

  plan:
    ComercialPlan |
    null;

  suscripcion:
    ComercialSuscripcion |
    null;

  esFree: boolean;

  puedeExportar: boolean;

  puedeCrearProyecto: boolean;

}


// =====================================================
// SERVICIO DE AUTENTICACIÓN
// =====================================================

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API_URL =
    `${environment.apiUrl}/auth`;

  private readonly COMERCIAL_URL =
    `${environment.apiUrl}/comercial`;

  private readonly TOKEN_KEY =
    'topopro_token';

  private readonly USUARIO_KEY =
    'topopro_usuario';

  private readonly COMERCIAL_KEY =
    'topopro_comercial';


  // =====================================================
  // USUARIO ACTUAL
  // =====================================================

  usuarioActual =
    signal<Usuario | null>(
      this.obtenerUsuarioGuardado()
    );


  // =====================================================
  // CONTEXTO COMERCIAL ACTUAL
  // =====================================================

  comercialActual =
    signal<ComercialContexto | null>(
      this.obtenerComercialGuardado()
    );


  constructor(
    private http: HttpClient,
    private permisoService: PermisoService
  ) {}


  // =====================================================
  // REGISTRO
  // =====================================================

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

          this.guardarSesion(
            respuesta
          );

          this.cargarPermisos();

          this.cargarContextoComercial();

        })

      );

  }


  // =====================================================
  // LOGIN
  // =====================================================

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
          this.guardarSesion(
            respuesta
          );

          // Cargar permisos
          this.cargarPermisos();

          // Cargar información comercial
          this.cargarContextoComercial();

        })

      );

  }


  // =====================================================
  // CARGAR PERMISOS
  // =====================================================

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
            .establecerPermisos(
              permisos
            );

        },

        error: error => {

          console.error(
            'Error cargando permisos:',
            error
          );

        }

      });

  }


  // =====================================================
  // CARGAR CONTEXTO COMERCIAL
  // =====================================================

  cargarContextoComercial(): void {

    if (!this.estaAutenticado()) {

      return;

    }


    this.http
      .get<ComercialContexto>(
        this.COMERCIAL_URL
      )
      .subscribe({

        next: contexto => {

          console.log(
            'Contexto comercial cargado:',
            contexto
          );

          localStorage.setItem(
            this.COMERCIAL_KEY,
            JSON.stringify(
              contexto
            )
          );

          this.comercialActual.set(
            contexto
          );

        },

        error: error => {

          console.error(
            'Error cargando contexto comercial:',
            error
          );

        }

      });

  }


  // =====================================================
  // OBTENER CONTEXTO COMERCIAL
  // =====================================================

  obtenerContextoComercial():
    Observable<ComercialContexto> {

    return this.http.get<ComercialContexto>(
      this.COMERCIAL_URL
    ).pipe(

      tap(contexto => {

        localStorage.setItem(
          this.COMERCIAL_KEY,
          JSON.stringify(
            contexto
          )
        );

        this.comercialActual.set(
          contexto
        );

      })

    );

  }


  // =====================================================
  // PERFIL
  // =====================================================

  obtenerPerfil():
    Observable<{ usuario: Usuario }> {

    return this.http.get<{
      usuario: Usuario
    }>(
      `${this.API_URL}/perfil`
    );

  }


  // =====================================================
  // ACTUALIZAR PERFIL
  // =====================================================

  actualizarPerfil(
    datos: Partial<Usuario>
  ):
    Observable<{ usuario: Usuario }> {

    return this.http
      .put<{
        usuario: Usuario
      }>(
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


  // =====================================================
  // SUBIR FOTO
  // =====================================================

  subirFoto(
    archivo: File
  ):
    Observable<{ usuario: Usuario }> {

    const formData =
      new FormData();

    formData.append(
      'foto',
      archivo
    );


    return this.http
      .put<{
        usuario: Usuario
      }>(
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


  // =====================================================
  // CAMBIAR PASSWORD
  // =====================================================

  cambiarPassword(
    datos: {
      passwordActual: string;
      passwordNueva: string;
    }
  ):
    Observable<{ mensaje: string }> {

    return this.http.put<{
      mensaje: string
    }>(
      `${this.API_URL}/perfil/password`,
      datos
    );

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {

    localStorage.removeItem(
      this.TOKEN_KEY
    );

    localStorage.removeItem(
      this.USUARIO_KEY
    );

    localStorage.removeItem(
      this.COMERCIAL_KEY
    );

    this.permisoService.limpiar();

    this.usuarioActual.set(
      null
    );

    this.comercialActual.set(
      null
    );

  }


  // =====================================================
  // TOKEN
  // =====================================================

  obtenerToken(): string | null {

    return localStorage.getItem(
      this.TOKEN_KEY
    );

  }


  // =====================================================
  // AUTENTICACIÓN
  // =====================================================

  estaAutenticado(): boolean {

    return !!this.obtenerToken();

  }


  // =====================================================
  // GUARDAR SESIÓN
  // =====================================================

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


  // =====================================================
  // ACTUALIZAR USUARIO LOCAL
  // =====================================================

  private actualizarUsuarioLocal(
    usuario: Usuario
  ): void {

    localStorage.setItem(
      this.USUARIO_KEY,
      JSON.stringify(
        usuario
      )
    );

    this.usuarioActual.set(
      usuario
    );

  }


  // =====================================================
  // OBTENER USUARIO GUARDADO
  // =====================================================

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


  // =====================================================
  // OBTENER COMERCIAL GUARDADO
  // =====================================================

  private obtenerComercialGuardado():
    ComercialContexto | null {

    const data =
      localStorage.getItem(
        this.COMERCIAL_KEY
      );

    if (!data) {

      return null;

    }

    try {

      return JSON.parse(
        data
      ) as ComercialContexto;

    } catch (error) {

      console.error(
        'Error leyendo contexto comercial local:',
        error
      );

      localStorage.removeItem(
        this.COMERCIAL_KEY
      );

      return null;

    }

  }

}
