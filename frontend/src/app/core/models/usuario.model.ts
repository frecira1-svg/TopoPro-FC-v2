export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  profesion?: string;
  empresa?: string;
  ciudad?: string;
  pais?: string;
  foto?: string;
  rol: 'ADMIN' | 'USUARIO';
  activo: boolean;
  emailVerificado: boolean;
  fechaRegistro: string;
}

export interface AuthResponse {
  usuario: Usuario;
  token: string;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  telefono?: string;
  profesion?: string;
  empresa?: string;
  ciudad?: string;
  pais?: string;
}
