import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Cliente
} from '../models/cliente.model';

import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private readonly API_URL =
    `${environment.apiUrl}/clientes`;


  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // OBTENER TODOS
  // =====================================================

  obtenerTodos(): Observable<Cliente[]> {

    return this.http.get<Cliente[]>(
      this.API_URL
    );

  }


  // =====================================================
  // OBTENER POR ID
  // =====================================================

  obtenerPorId(
    id: number
  ): Observable<Cliente> {

    return this.http.get<Cliente>(
      `${this.API_URL}/${id}`
    );

  }


  // =====================================================
  // CREAR
  // =====================================================

  crear(
    datos: Partial<Cliente>
  ): Observable<Cliente> {

    return this.http.post<Cliente>(
      this.API_URL,
      datos
    );

  }


  // =====================================================
  // ACTUALIZAR
  // =====================================================

  actualizar(
    id: number,
    datos: Partial<Cliente>
  ): Observable<Cliente> {

    return this.http.put<Cliente>(
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
