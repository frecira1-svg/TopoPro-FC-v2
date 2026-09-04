export interface PuntoTopografico {
  id: number;
  codigo: string;
  norte: number;
  este: number;
  elevacion: number;
  descripcion?: string;
  tipo?: string;
  precision?: number;
  equipo?: string;
  metodo?: string;
  observaciones?: string;
  latitud?: number;
  longitud?: number;
  proyectoId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PuntoTopograficoRequest {
  proyectoId: number;
  codigo: string;
  norte: number;
  este: number;
  elevacion: number;
  descripcion?: string;
  tipo?: string;
  precision?: number;
  equipo?: string;
  metodo?: string;
  observaciones?: string;
  latitud?: number;
  longitud?: number;
}
