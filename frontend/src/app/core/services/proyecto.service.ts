import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Proyecto,
  ProyectoRequest
} from '../models/proyecto.model';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {

  private readonly API_URL =
    `${environment.apiUrl}/proyectos`;


  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // OBTENER TODOS
  // =====================================================

  obtenerTodos(): Observable<Proyecto[]> {

    return this.http.get<Proyecto[]>(
      this.API_URL
    );

  }


  // =====================================================
  // OBTENER POR ID
  // =====================================================

  obtenerPorId(
    id: number
  ): Observable<Proyecto> {

    return this.http.get<Proyecto>(
      `${this.API_URL}/${id}`
    );

  }


  // =====================================================
  // CREAR
  // =====================================================

  crear(
    datos: ProyectoRequest
  ): Observable<Proyecto> {

    return this.http.post<Proyecto>(
      this.API_URL,
      datos
    );

  }


  // =====================================================
  // ACTUALIZAR
  // =====================================================

  actualizar(
    id: number,
    datos: ProyectoRequest
  ): Observable<Proyecto> {

    return this.http.put<Proyecto>(
      `${this.API_URL}/${id}`,
      datos
    );

  }


  // =====================================================
  // ELIMINAR
  // =====================================================

  eliminar(
    id: number
  ): Observable<any> {

    return this.http.delete(
      `${this.API_URL}/${id}`
    );

  }

}
