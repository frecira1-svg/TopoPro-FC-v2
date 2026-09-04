import { Publicacion } from './publicacion.model';

export interface PerfilPublico {
  id: number;
  nombre: string;
  apellido: string;
  profesion?: string;
  empresa?: string;
  ciudad?: string;
  pais?: string;
  foto?: string;
  fechaRegistro: string;
  publicacionesCount: number;
  publicaciones: Publicacion[];
}
