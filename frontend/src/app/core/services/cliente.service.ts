import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  Cliente
} from '../models/cliente.model';

import { environment } from '../../environments/environment';
import { OfflineDbService } from './offline/offline-db.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private readonly API_URL =
    `${environment.apiUrl}/clientes`;

  constructor(
    private http: HttpClient,
    private offlineDb: OfflineDbService
  ) {}


  // =====================================================
  // OBTENER TODOS
  // =====================================================

  obtenerTodos(): Observable<Cliente[]> {

    // ---------------------------------------------------
    // OFFLINE DIRECTO
    // No intentamos contactar la API si el navegador
    // ya sabe que no tiene conexión.
    // ---------------------------------------------------

    if (!navigator.onLine) {

      console.log(
        'Modo offline detectado. Cargando clientes desde IndexedDB...'
      );

      return from(
        this.offlineDb.obtenerClientes<Cliente>()
      );

    }


    // ---------------------------------------------------
    // ONLINE
    // Consultar API y guardar en IndexedDB
    // ---------------------------------------------------

    return this.http
      .get<Cliente[]>(
        this.API_URL
      )
      .pipe(

        switchMap(clientes => {

          return from(
            Promise.all(
              clientes.map(cliente =>
                this.offlineDb.guardarCliente(cliente)
              )
            )
          ).pipe(

            map(() => clientes)

          );

        }),

        // -------------------------------------------------
        // RESPALDO
        // Si aparentemente estamos online pero la API
        // falla, usamos IndexedDB.
        // -------------------------------------------------

        catchError(error => {

          console.warn(
            'API de clientes no disponible. ' +
            'Cargando clientes desde IndexedDB...',
            error
          );

          return from(
            this.offlineDb.obtenerClientes<Cliente>()
          );

        })

      );

  }


  // =====================================================
  // OBTENER POR ID
  // =====================================================

  obtenerPorId(
    id: number
  ): Observable<Cliente> {

    // ---------------------------------------------------
    // OFFLINE DIRECTO
    // ---------------------------------------------------

    if (!navigator.onLine) {

      console.log(
        'Modo offline detectado. ' +
        `Cargando cliente ${id} desde IndexedDB...`
      );

      return from(
        this.offlineDb.obtenerCliente<Cliente>(id)
      ).pipe(

        map(cliente => {

          if (!cliente) {

            throw new Error(
              'El cliente no está disponible offline.'
            );

          }

          return cliente;

        })

      );

    }


    // ---------------------------------------------------
    // ONLINE
    // ---------------------------------------------------

    return this.http
      .get<Cliente>(
        `${this.API_URL}/${id}`
      )
      .pipe(

        switchMap(cliente => {

          return from(
            this.offlineDb.guardarCliente(cliente)
          ).pipe(

            map(() => cliente)

          );

        }),

        // -------------------------------------------------
        // RESPALDO OFFLINE
        // -------------------------------------------------

        catchError(error => {

          console.warn(
            'API no disponible. ' +
            'Cargando cliente desde IndexedDB...',
            error
          );

          return from(
            this.offlineDb.obtenerCliente<Cliente>(id)
          ).pipe(

            map(cliente => {

              if (!cliente) {

                throw new Error(
                  'El cliente no está disponible offline.'
                );

              }

              return cliente;

            })

          );

        })

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
