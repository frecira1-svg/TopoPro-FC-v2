import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProfesionalDirectorio } from '../models/profesional-directorio.model';

@Injectable({ providedIn: 'root' })
export class DirectorioService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/directorio`;

  listar(filtros: { busqueda?: string; ciudad?: string; especialidad?: string } = {}): Observable<ProfesionalDirectorio[]> {
    let params = new HttpParams();
    if (filtros.busqueda?.trim()) params = params.set('busqueda', filtros.busqueda.trim());
    if (filtros.ciudad?.trim()) params = params.set('ciudad', filtros.ciudad.trim());
    if (filtros.especialidad?.trim()) params = params.set('especialidad', filtros.especialidad.trim());
    return this.http.get<ProfesionalDirectorio[]>(this.api, { params });
  }
}
