export interface ProfesionalDirectorioTrabajo {
  id: number;
  titulo: string;
  tipoTrabajo?: string;
  imagen?: string | null;
}

export interface ProfesionalDirectorio {
  id: number;
  nombre: string;
  apellido: string;
  profesion?: string;
  empresa?: string;
  ciudad?: string;
  pais?: string;
  foto?: string;
  publicacionesCount: number;
  especialidades: string[];
  trabajos: ProfesionalDirectorioTrabajo[];
}
