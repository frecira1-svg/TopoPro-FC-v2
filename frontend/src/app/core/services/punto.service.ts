import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  PuntoTopografico,
  PuntoTopograficoRequest
} from '../models/punto.model';

import { environment } from '../../environments/environment';
import { OfflineDbService } from './offline/offline-db.service';

import {
  OperacionSync
} from '../models/sync-operation.model';

@Injectable({
  providedIn: 'root'
})
export class PuntoService {

  private readonly API_URL =
    `${environment.apiUrl}/puntos`;

  constructor(
    private http: HttpClient,
    private offlineDb: OfflineDbService
  ) {}


  // =====================================================
  // OBTENER TODOS
  // =====================================================

  obtenerTodos(): Observable<PuntoTopografico[]> {

    return this.http
      .get<PuntoTopografico[]>(this.API_URL)
      .pipe(

        switchMap(puntos =>
          from(
            Promise.all(
              puntos.map(punto =>
                this.offlineDb.guardarPunto(punto)
              )
            )
          ).pipe(
            map(() => puntos)
          )
        ),

        catchError(error => {

          console.warn(
            'API no disponible para obtener todos los puntos.',
            'Usando IndexedDB...',
            error
          );

          return from(
            this.obtenerTodosDesdeIndexedDB()
          );

        })
      );
  }


  // =====================================================
  // OBTENER POR PROYECTO
  // =====================================================

  obtenerPorProyecto(
    proyectoId: number
  ): Observable<PuntoTopografico[]> {

    if (!navigator.onLine) {

      console.log(
        `Modo offline detectado. ` +
        `Cargando puntos del proyecto ${proyectoId} desde IndexedDB...`
      );

      return from(
        this.offlineDb.obtenerPuntosPorProyecto<PuntoTopografico>(
          proyectoId
        )
      );
    }


    return this.http
      .get<PuntoTopografico[]>(
        `${this.API_URL}/proyecto/${proyectoId}`
      )
      .pipe(

        switchMap(puntos =>
          from(
            Promise.all(
              puntos.map(punto =>
                this.offlineDb.guardarPunto(punto)
              )
            )
          ).pipe(
            map(() => puntos)
          )
        ),

        catchError(error => {

          console.warn(
            `API no disponible para el proyecto ${proyectoId}. ` +
            'Cargando puntos desde IndexedDB...',
            error
          );

          return from(
            this.offlineDb.obtenerPuntosPorProyecto<PuntoTopografico>(
              proyectoId
            )
          );
        })
      );
  }


  // =====================================================
  // OBTENER POR ID
  // =====================================================

  obtenerPorId(
    id: number
  ): Observable<PuntoTopografico> {

    if (!navigator.onLine) {

      console.log(
        `Modo offline detectado. ` +
        `Cargando punto ${id} desde IndexedDB...`
      );

      return from(
        this.offlineDb.obtenerPunto<PuntoTopografico>(id)
      ).pipe(

        map(punto => {

          if (!punto) {

            throw new Error(
              'El punto no está disponible offline.'
            );

          }

          return punto;

        })
      );
    }


    return this.http
      .get<PuntoTopografico>(
        `${this.API_URL}/${id}`
      )
      .pipe(

        switchMap(punto =>
          from(
            this.offlineDb.guardarPunto(punto)
          ).pipe(
            map(() => punto)
          )
        ),

        catchError(error => {

          console.warn(
            `API no disponible para el punto ${id}. ` +
            'Cargando desde IndexedDB...',
            error
          );

          return from(
            this.offlineDb.obtenerPunto<PuntoTopografico>(id)
          ).pipe(

            map(punto => {

              if (!punto) {

                throw new Error(
                  'El punto no está disponible offline.'
                );

              }

              return punto;

            })
          );
        })
      );
  }

 // =====================================================
// CREAR PUNTO
// =====================================================

crear(
  datos: PuntoTopograficoRequest
): Observable<PuntoTopografico> {

  return this.http
    .post<PuntoTopografico>(
      this.API_URL,
      datos
    )
    .pipe(

      // =================================================
      // ONLINE: guardar también en IndexedDB
      // =================================================

      switchMap(punto =>
        from(
          this.offlineDb.guardarPunto(punto)
        ).pipe(
          map(() => punto)
        )
      ),

      // =================================================
      // OFFLINE: guardar localmente + agregar a cola
      // =================================================

      catchError(error => {

        console.warn(
          'POST /puntos falló.',
          'Guardando creación en modo offline...',
          error
        );

        const idTemporal = -Date.now();

        const puntoOffline: PuntoTopografico = {
          ...datos,
          id: idTemporal,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const operacion: OperacionSync = {
          tipo: 'CREAR_PUNTO',
          entidad: 'PUNTO',
          entidadId: idTemporal,
          datos: {
            ...datos
          },
          fecha: new Date().toISOString()
        };

        return from(
          this.offlineDb.guardarPunto(
            puntoOffline
          )
        ).pipe(

          switchMap(() =>
            from(
              this.offlineDb.agregarACola(
                operacion
              )
            )
          ),

          map(() => puntoOffline)

        );

      })

    );
}

// =====================================================
// ACTUALIZAR PUNTO
// =====================================================

actualizar(
  id: number,
  datos: PuntoTopograficoRequest
): Observable<PuntoTopografico> {

  /*
   * =====================================================
   * INTENTO ONLINE
   * =====================================================
   *
   * Primero intentamos guardar en el servidor.
   *
   * Esto es importante porque navigator.onLine puede
   * devolver true aunque Chrome DevTools esté simulando
   * una desconexión.
   */
  return this.http
    .put<PuntoTopografico>(
      `${this.API_URL}/${id}`,
      datos
    )
    .pipe(

      /*
       * Si el servidor responde correctamente,
       * actualizamos también IndexedDB.
       */
      switchMap(punto =>
        from(
          this.offlineDb.guardarPunto(punto)
        ).pipe(
          map(() => punto)
        )
      ),

      /*
       * =================================================
       * FALLBACK OFFLINE
       * =================================================
       *
       * Si el PUT falla por falta de conexión, guardamos
       * el cambio localmente y agregamos la operación a
       * syncQueue.
       */
      catchError(error => {

        console.warn(
          `No fue posible actualizar el punto ${id} en la API.`,
          'Guardando cambio localmente...',
          error
        );

        return from(
          this.offlineDb.obtenerPunto<PuntoTopografico>(id)
        ).pipe(

          switchMap(puntoExistente => {

            if (!puntoExistente) {

              throw new Error(
                'El punto no está disponible offline.'
              );

            }


            const puntoActualizado: PuntoTopografico = {

              ...puntoExistente,

              ...datos,

              id,

              updatedAt:
                new Date().toISOString()

            };


            const operacion: OperacionSync = {

              tipo: 'ACTUALIZAR_PUNTO',

              entidad: 'PUNTO',

              entidadId: id,

              datos: {
                ...datos
              },

              fecha:
                new Date().toISOString()

            };


            return from(

              Promise.all([

                this.offlineDb.guardarPunto(
                  puntoActualizado
                ),

                this.offlineDb.agregarACola(
                  operacion
                )

              ])

            ).pipe(

              map(() => puntoActualizado)

            );

          })

        );

      })

    );
}


  // =====================================================
  // ELIMINAR PUNTO
  // =====================================================

  eliminar(
    id: number
  ): Observable<any> {

    /*
     * =====================================================
     * MODO OFFLINE
     * =====================================================
     */

    if (!navigator.onLine) {

      console.log(
        `Modo offline. Eliminando punto ${id} localmente...`
      );


      return from(
        this.offlineDb.obtenerPunto<PuntoTopografico>(id)
      ).pipe(

        switchMap(puntoExistente => {

          if (!puntoExistente) {

            throw new Error(
              'El punto no está disponible offline.'
            );

          }


          const operacion: OperacionSync = {

            tipo: 'ELIMINAR_PUNTO',

            entidad: 'PUNTO',

            entidadId: id,

            fecha: new Date().toISOString()

          };


          return from(

            this.offlineDb
              .agregarACola(operacion)

          ).pipe(

            switchMap(() =>
              from(
                this.offlineDb.eliminarPunto(id)
              )
            ),

            map(() => ({
              mensaje:
                'Punto eliminado localmente. ' +
                'Quedará pendiente de sincronización.'
            }))

          );

        })

      );
    }


    /*
     * =====================================================
     * MODO ONLINE
     * =====================================================
     */

    return this.http
      .delete(
        `${this.API_URL}/${id}`
      )
      .pipe(

        switchMap(respuesta =>
          from(
            this.offlineDb.eliminarPunto(id)
          ).pipe(
            map(() => respuesta)
          )
        )
      );
  }


  // =====================================================
  // IMPORTAR CSV
  // =====================================================

  importarCSV(
    proyectoId: number,
    archivo: File
  ): Observable<{
    mensaje: string;
    total: number;
  }> {

    const formData =
      new FormData();

    formData.append(
      'archivo',
      archivo
    );


    return this.http
      .post<{
        mensaje: string;
        total: number;
      }>(
        `${this.API_URL}/importar/${proyectoId}`,
        formData
      );
  }


  // =====================================================
  // OBTENER TODOS DESDE INDEXEDDB
  // =====================================================

  private obtenerTodosDesdeIndexedDB():
    Promise<PuntoTopografico[]> {

    return new Promise(
      (resolve, reject) => {

        const request =
          indexedDB.open(
            'TopoProOffline'
          );


        request.onsuccess =
          event => {

            const db =
              (
                event.target as
                IDBOpenDBRequest
              ).result;


            try {

              const transaction =
                db.transaction(
                  'puntos',
                  'readonly'
                );


              const store =
                transaction.objectStore(
                  'puntos'
                );


              const getRequest =
                store.getAll();


              getRequest.onsuccess =  () => {

                  resolve(
                    getRequest.result as PuntoTopografico[]
                  );

                  db.close();

                };


              getRequest.onerror =
                () => {

                  reject(
                    getRequest.error
                  );

                  db.close();

                };

            } catch (error) {

              reject(error);

              db.close();

            }

          };


        request.onerror =
          () => {

            reject(
              request.error
            );

          };

      }
    );
  }

}
