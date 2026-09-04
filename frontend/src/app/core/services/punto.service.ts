import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PuntoTopografico, PuntoTopograficoRequest } from '../models/punto.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PuntoService {
  private readonly API_URL = `${environment.apiUrl}/puntos`;

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<PuntoTopografico[]> {
    return this.http.get<PuntoTopografico[]>(this.API_URL);
  }

  obtenerPorProyecto(proyectoId: number): Observable<PuntoTopografico[]> {
    return this.http.get<PuntoTopografico[]>(`${this.API_URL}/proyecto/${proyectoId}`);
  }

  obtenerPorId(id: number): Observable<PuntoTopografico> {
    return this.http.get<PuntoTopografico>(`${this.API_URL}/${id}`);
  }

  crear(datos: PuntoTopograficoRequest): Observable<PuntoTopografico> {
    return this.http.post<PuntoTopografico>(this.API_URL, datos);
  }

  actualizar(id: number, datos: PuntoTopograficoRequest): Observable<PuntoTopografico> {
    return this.http.put<PuntoTopografico>(`${this.API_URL}/${id}`, datos);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  importarCSV(proyectoId: number, archivo: File): Observable<{ mensaje: string; total: number }> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<{ mensaje: string; total: number }>(
      `${this.API_URL}/importar/${proyectoId}`,
      formData
    );
  }
}
