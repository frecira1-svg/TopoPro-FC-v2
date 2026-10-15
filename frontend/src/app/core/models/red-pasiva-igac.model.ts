export interface PuntoRedPasivaIGAC {
  id: number;
  fid: number;
  nomenclatura: string;
  municipio: string;
  departamento: string;
  estado: string | null;
  latitud: number;
  longitud: number;
  alturaElipsoidal: number | null;
  distanciaKm?: number;
}

export interface RespuestaRedPasivaIGAC {
  origen?: {
    latitud: number;
    longitud: number;
  };
  radioKm?: number;
  totalDevuelto?: number;
  datos: PuntoRedPasivaIGAC[];
  paginacion?: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}
