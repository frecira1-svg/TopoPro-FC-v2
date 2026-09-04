import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Levantamiento } from '../models/levantamiento';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LevantamientosService {
  private readonly API_URL = `${environment.apiUrl}/levantamientos`;

  constructor(private http: HttpClient) {}

  obtenerLevantamientos(proyectoId?: number): Observable<Levantamiento[]> {
    let params = new HttpParams();
    if (proyectoId) {
      params = params.set('proyectoId', proyectoId.toString());
    }
    return this.http.get<Levantamiento[]>(this.API_URL, { params });
  }

  obtenerLevantamiento(id: number): Observable<Levantamiento> {
    return this.http.get<Levantamiento>(`${this.API_URL}/${id}`);
  }

  crearLevantamiento(levantamiento: Levantamiento): Observable<Levantamiento> {
    return this.http.post<Levantamiento>(this.API_URL, levantamiento);
  }

  actualizarLevantamiento(id: number, levantamiento: Levantamiento): Observable<Levantamiento> {
    return this.http.put<Levantamiento>(`${this.API_URL}/${id}`, levantamiento);
  }

  eliminarLevantamiento(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
