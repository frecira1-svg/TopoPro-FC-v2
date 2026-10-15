import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  PuntoRedPasivaIGAC,
  RespuestaRedPasivaIGAC
} from '../models/red-pasiva-igac.model';

@Injectable({
  providedIn: 'root'
})
export class RedPasivaIGACService {
  private readonly API_URL =
    `${environment.apiUrl}/igac/red-pasiva`;

  constructor(private http: HttpClient) {}

  obtenerCercanos(
    latitud: number,
    longitud: number,
    radioKm = 10,
    limite = 100
  ): Observable<RespuestaRedPasivaIGAC> {
    const params = new HttpParams()
      .set('latitud', latitud)
      .set('longitud', longitud)
      .set('radioKm', radioKm)
      .set('limite', limite);

    return this.http.get<RespuestaRedPasivaIGAC>(
      `${this.API_URL}/cercanos`,
      { params }
    );
  }

  listar(
    pagina = 1,
    limite = 20,
    busqueda = '',
    departamento = '',
    municipio = ''
  ): Observable<RespuestaRedPasivaIGAC> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('limite', limite);

    if (busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }

    if (departamento.trim()) {
      params = params.set('departamento', departamento.trim());
    }

    if (municipio.trim()) {
      params = params.set('municipio', municipio.trim());
    }

    return this.http.get<RespuestaRedPasivaIGAC>(
      this.API_URL,
      { params }
    );
  }
}
