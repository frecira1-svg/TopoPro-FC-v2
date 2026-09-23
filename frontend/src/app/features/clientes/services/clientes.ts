import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import {
  catchError,
  map,
  switchMap
} from 'rxjs/operators';

import { Cliente } from '../models/cliente';
import { environment } from '../../../environments/environment';

import { OfflineDbService } from '../../../core/services/offline/offline-db.service';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private http = inject(HttpClient);
  private offlineDb = inject(OfflineDbService);

  private apiUrl =
    `${environment.apiUrl}/clientes`;


  // =====================================================
  // OBTENER TODOS
  // =====================================================

  obtenerClientes(): Observable<Cliente[]> {

    // ---------------------------------------------------
    // OFFLINE DIRECTO
    // ---------------------------------------------------

    if (!navigator.onLine) {

      console.log(
        'Modo offline detectado. ' +
        'Cargando clientes desde IndexedDB...'
      );

      return from(
        this.offlineDb.obtenerClientes<Cliente>()
      );

    }


    // ---------------------------------------------------
    // ONLINE
    // ---------------------------------------------------

    return this.http
      .get<Cliente[]>(
        this.apiUrl
      )
      .pipe(

        switchMap(clientes => {

          return from(
            Promise.all(
              clientes.map(cliente =>
                this.guardarClienteOffline(cliente)
              )
            )
          ).pipe(

            map(() => clientes)

          );

        }),

        // -------------------------------------------------
        // RESPALDO
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
  // OBTENER CLIENTE POR ID
  // =====================================================

  obtenerCliente(
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
        `${this.apiUrl}/${id}`
      )
      .pipe(

        switchMap(cliente => {

          return from(
            this.guardarClienteOffline(cliente)
          ).pipe(

            map(() => cliente)

          );

        }),

        catchError(error => {

          console.warn(
            'API de clientes no disponible. ' +
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
  // CREAR CLIENTE
  // =====================================================

  crearCliente(
    cliente: Cliente
  ): Observable<Cliente> {

    return this.http
      .post<Cliente>(
        this.apiUrl,
        cliente
      )
      .pipe(

        switchMap(clienteCreado => {

          return from(
            this.guardarClienteOffline(clienteCreado)
          ).pipe(

            map(() => clienteCreado)

          );

        })

      );

  }


  // =====================================================
  // ACTUALIZAR CLIENTE
  // =====================================================

  actualizarCliente(
    id: number,
    cliente: Cliente
  ): Observable<Cliente> {

    return this.http
      .put<Cliente>(
        `${this.apiUrl}/${id}`,
        cliente
      )
      .pipe(

        switchMap(clienteActualizado => {

          return from(
            this.guardarClienteOffline(clienteActualizado)
          ).pipe(

            map(() => clienteActualizado)

          );

        })

      );

  }


  // =====================================================
  // ELIMINAR CLIENTE
  // =====================================================

  eliminarCliente(
    id: number
  ): Observable<void> {

    return this.http
      .delete<void>(
        `${this.apiUrl}/${id}`
      )
      .pipe(

        switchMap(respuesta => {

          return from(
            this.offlineDb.eliminarCliente(id)
          ).pipe(

            map(() => respuesta)

          );

        })

      );

  }


  // =====================================================
  // GUARDAR CLIENTE OFFLINE
  // =====================================================

  private guardarClienteOffline(
    cliente: Cliente
  ): Promise<void> {

    if (typeof cliente.id !== 'number') {

      console.warn(
        'Cliente recibido sin ID. ' +
        'No se guardará en IndexedDB:',
        cliente
      );

      return Promise.resolve();

    }

    return this.offlineDb.guardarCliente(
      cliente as Cliente & { id: number }
    );

  }

}
