import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { OfflineDbService } from './offline-db.service';

import {
  OperacionSync
} from '../../models/sync-operation.model';

import {
  PuntoTopografico
} from '../../models/punto.model';


@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {

  private readonly http = inject(HttpClient);
  private readonly offlineDb = inject(OfflineDbService);

  private readonly API_URL =
    `${environment.apiUrl}/puntos`;

  private sincronizando = false;


  // =====================================================
  // SINCRONIZAR OPERACIONES PENDIENTES
  // =====================================================

  async sincronizar(): Promise<void> {

    if (this.sincronizando) {

      console.log(
        'Ya existe una sincronización en curso.'
      );

      return;

    }


    if (!navigator.onLine) {

      console.log(
        'Sin conexión. Se mantiene la cola offline.'
      );

      return;

    }


    this.sincronizando = true;


    try {

      const operaciones =
        await this.offlineDb.obtenerCola<OperacionSync>();


      if (!operaciones.length) {

        console.log(
          'No hay operaciones pendientes de sincronizar.'
        );

        return;

      }


      console.log(
        `Sincronizando ${operaciones.length} operación(es) pendiente(s)...`
      );


      for (const operacion of operaciones) {

        try {

          await this.procesarOperacion(
            operacion
          );


          /*
           * Solo eliminamos la operación después
           * de haberla procesado correctamente.
           */
          if (operacion.id !== undefined) {

            await this.offlineDb.eliminarDeCola(
              operacion.id
            );

          }


          console.log(
            'Operación sincronizada:',
            operacion
          );


        } catch (error) {

          console.error(
            'No fue posible sincronizar la operación:',
            operacion,
            error
          );

        }

      }


    } catch (error) {

      console.error(
        'Error obteniendo la cola de sincronización:',
        error
      );


    } finally {

      this.sincronizando = false;

    }

  }


  // =====================================================
  // PROCESAR UNA OPERACIÓN
  // =====================================================

  private async procesarOperacion(
    operacion: OperacionSync
  ): Promise<void> {

    switch (operacion.tipo) {


      // =================================================
      // CREAR PUNTO
      // =================================================

      case 'CREAR_PUNTO': {

        if (!operacion.datos) {

          throw new Error(
            'La operación CREAR_PUNTO no contiene datos.'
          );

        }


        /*
         * El ID temporal usado en IndexedDB puede venir
         * en entidadId.
         *
         * Si existe, lo eliminamos después de recibir
         * el punto real del servidor.
         */
        const idTemporal =
          operacion.entidadId;


        try {

          /*
           * Guardamos la respuesta completa del servidor.
           * Aquí obtenemos el ID REAL.
           */
          const puntoServidor =
            await firstValueFrom(
              this.http.post<PuntoTopografico>(
                this.API_URL,
                operacion.datos
              )
            );


          /*
           * Si existe un registro temporal, lo eliminamos.
           */
          if (
            idTemporal !== undefined
          ) {

            await this.offlineDb.eliminarPunto(
              idTemporal
            );

          }


          /*
           * Guardamos el punto devuelto por el servidor.
           *
           * Esto almacena el ID REAL, por ejemplo:
           *
           * temporal: -172709...
           * servidor: 209
           */
          await this.offlineDb.guardarPunto(
            puntoServidor
          );


          console.log(
            'Punto creado correctamente en servidor:',
            puntoServidor
          );


        } catch (error: any) {

          /*
           * Puede ocurrir que el punto haya llegado al
           * servidor pero una segunda sincronización
           * intente crearlo nuevamente.
           *
           * En ese caso el backend responde 400 indicando
           * que el código ya existe.
           *
           * Intentamos localizar el punto existente y
           * reconciliarlo con IndexedDB.
           */
          if (
            error?.status === 400 &&
            error?.error?.error &&
            typeof error.error.error === 'string' &&
            error.error.error.includes(
              'Ya existe un punto con el código'
            )
          ) {

            console.warn(
              'El punto ya existe en el servidor. Intentando reconciliar:',
              operacion.datos.codigo
            );


            const puntosServidor =
              await firstValueFrom(
                this.http.get<PuntoTopografico[]>(
                  this.API_URL
                )
              );


            const puntoExistente =
              puntosServidor.find(
                punto =>
                  punto.codigo ===
                    operacion.datos?.codigo &&
                  punto.proyectoId ===
                    operacion.datos?.proyectoId
              );


            if (!puntoExistente) {

              throw error;

            }


            /*
             * Eliminamos el registro temporal.
             */
            if (
              idTemporal !== undefined
            ) {

              await this.offlineDb.eliminarPunto(
                idTemporal
              );

            }


            /*
             * Guardamos el punto real del servidor.
             */
            await this.offlineDb.guardarPunto(
              puntoExistente
            );


            console.log(
              'Punto existente reconciliado correctamente:',
              puntoExistente
            );


            return;

          }


          throw error;

        }


        break;

      }


      // =================================================
      // ACTUALIZAR PUNTO
      // =================================================

      case 'ACTUALIZAR_PUNTO': {

        if (
          operacion.entidadId === undefined
        ) {

          throw new Error(
            'La operación ACTUALIZAR_PUNTO no contiene entidadId.'
          );

        }


        if (!operacion.datos) {

          throw new Error(
            'La operación ACTUALIZAR_PUNTO no contiene datos.'
          );

        }


        const puntoActualizado =
          await firstValueFrom(
            this.http.put<PuntoTopografico>(
              `${this.API_URL}/${operacion.entidadId}`,
              operacion.datos
            )
          );


        /*
         * Guardamos la versión confirmada por el servidor.
         */
        await this.offlineDb.guardarPunto(
          puntoActualizado
        );


        break;

      }


      // =================================================
      // ELIMINAR PUNTO
      // =================================================

      case 'ELIMINAR_PUNTO': {

        if (
          operacion.entidadId === undefined
        ) {

          throw new Error(
            'La operación ELIMINAR_PUNTO no contiene entidadId.'
          );

        }


        await firstValueFrom(
          this.http.delete(
            `${this.API_URL}/${operacion.entidadId}`
          )
        );


        /*
         * Eliminamos también la copia local.
         */
        await this.offlineDb.eliminarPunto(
          operacion.entidadId
        );


        break;

      }


      // =================================================
      // OPERACIÓN DESCONOCIDA
      // =================================================

      default: {

        const operacionDesconocida =
          operacion as never;

        throw new Error(
          `Tipo de operación no soportado: ${JSON.stringify(operacionDesconocida)}`
        );

      }

    }

  }

}
