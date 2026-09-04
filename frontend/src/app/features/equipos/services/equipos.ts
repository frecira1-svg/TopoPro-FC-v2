import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Equipo } from '../models/equipo';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EquiposService {
  private readonly API_URL = `${environment.apiUrl}/equipos`;

  constructor(private http: HttpClient) {}

  obtenerEquipos(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(this.API_URL);
  }

  obtenerEquipo(id: number): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.API_URL}/${id}`);
  }

  crearEquipo(equipo: Equipo): Observable<Equipo> {
    return this.http.post<Equipo>(this.API_URL, equipo);
  }

  actualizarEquipo(id: number, equipo: Equipo): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.API_URL}/${id}`, equipo);
  }

  eliminarEquipo(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
