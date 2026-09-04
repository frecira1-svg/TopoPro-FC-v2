export interface Proyecto {
  id: number;

  nombre: string;

  descripcion?: string | null;

  cliente: string;

  ubicacion: string;

  estado: string;

  fechaInicio: string;

  fechaFin?: string | null;

  usuarioId: number;

  createdAt: string;

  updatedAt: string;

  latitud?: number | null;

  longitud?: number | null;

  clienteId?: number | null;

  clienteRelacion?: {
    id: number;
    nombre: string;
    nit?: string | null;
    telefono?: string | null;
    correo?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
    contacto?: string | null;
  } | null;

  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
    profesion?: string | null;
    foto?: string | null;
    rol?: string;
  };
}

export interface ProyectoRequest {
  nombre: string;

  descripcion?: string;

  cliente: string;

  ubicacion: string;

  estado: string;

  latitud?: number | null;

  longitud?: number | null;

  clienteId?: number | null;
}
