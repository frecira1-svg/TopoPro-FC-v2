import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  Proyecto,
  ProyectoRequest
} from '../models/proyecto.model';

import { environment } from '../../environments/environment';
import { OfflineDbService } from './offline/offline-db.service';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {

  private readonly API_URL =
    `${environment.apiUrl}/proyectos`;


  constructor(
    private http: HttpClient,
    private offlineDb: OfflineDbService
  ) {}


  // =====================================================
  // OBTENER TODOS
  // =====================================================

  obtenerTodos(): Observable<Proyecto[]> {

    return this.http
      .get<Proyecto[]>(
        this.API_URL
      )
      .pipe(

        // -------------------------------------------------
        // ONLINE
        // Guardamos los proyectos recibidos en IndexedDB
        // -------------------------------------------------

        switchMap(proyectos => {

          return from(
            Promise.all(
              proyectos.map(proyecto =>
                this.offlineDb.guardarProyecto(proyecto)
              )
            )
          ).pipe(

            map(() => proyectos)

          );

        }),

        // -------------------------------------------------
        // OFFLINE
        // Si la API falla, usamos IndexedDB
        // -------------------------------------------------

        catchError(error => {

          console.warn(
            'API no disponible. Cargando proyectos desde IndexedDB...',
            error
          );

          return from(
            this.offlineDb.obtenerProyectos<Proyecto>()
          );

        })

      );

  }


  // =====================================================
  // OBTENER POR ID
  // =====================================================

  obtenerPorId(
    id: number
  ): Observable<Proyecto> {

    return this.http
      .get<Proyecto>(
        `${this.API_URL}/${id}`
      )
      .pipe(

        // -------------------------------------------------
        // ONLINE
        // Guardamos el proyecto recibido
        // -------------------------------------------------

        switchMap(proyecto => {

          return from(
            this.offlineDb.guardarProyecto(proyecto)
          ).pipe(

            map(() => proyecto)

          );

        }),

        // -------------------------------------------------
        // OFFLINE
        // -------------------------------------------------

        catchError(error => {

          console.warn(
            'API no disponible. Cargando proyecto desde IndexedDB...',
            error
          );

          return from(
            this.offlineDb.obtenerProyecto<Proyecto>(id)
          ).pipe(

            map(proyecto => {

              if (!proyecto) {

                throw new Error(
                  'El proyecto no está disponible offline.'
                );

              }

              return proyecto;

            })

          );

        })

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
