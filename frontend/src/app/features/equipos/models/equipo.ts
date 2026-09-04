export interface Equipo {
  id?: number;
  nombre: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  fechaCompra?: string;
  estado?: string;
  proyectoId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}
