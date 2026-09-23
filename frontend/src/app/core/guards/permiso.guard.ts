import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { of } from 'rxjs';
import {
  catchError,
  map,
  tap
} from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { PermisoService } from '../services/permiso.service';


export const permisoGuard = (
  permiso: string
): CanActivateFn => {

  return () => {

    const authService =
      inject(AuthService);

    const permisoService =
      inject(PermisoService);

    const router =
      inject(Router);


    // =================================================
    // USUARIO ACTUAL
    // =================================================

    const usuario =
      authService.usuarioActual();


    // =================================================
    // SIN USUARIO → LOGIN
    // =================================================

    if (!usuario) {

      return router.createUrlTree([
        '/login'
      ]);

    }


    // =================================================
    // ADMIN → TODO PERMITIDO
    // =================================================

    if (usuario.rol === 'ADMIN') {

      return true;

    }


    // =================================================
    // ONLINE → ACTUALIZAR PERMISOS
    // OFFLINE → USAR PERMISOS LOCALES
    // =================================================

    return permisoService
      .obtenerMisPermisos()
      .pipe(

        tap(permisos => {

          // Guardar los permisos más recientes
          // para poder utilizarlos posteriormente
          // sin conexión.

          permisoService.establecerPermisos(
            permisos
          );

        }),

        map(permisos => {

          const permitido =
            Boolean(
              (permisos as any)[permiso]
            );


          if (permitido) {

            return true;

          }


          return router.createUrlTree([
            '/dashboard'
          ]);

        }),


        // =================================================
        // SIN CONEXIÓN
        // =================================================

        catchError(error => {

          console.warn(
            'API de permisos no disponible. ' +
            'Usando permisos guardados localmente.',
            error
          );


          const permisosLocales =
            permisoService
              .obtenerPermisosActuales();


          // ===============================================
          // NO HAY PERMISOS LOCALES
          // ===============================================

          if (!permisosLocales) {

            return of(
              router.createUrlTree([
                '/dashboard'
              ])
            );

          }


          // ===============================================
          // VERIFICAR PERMISO LOCAL
          // ===============================================

          const permitido =
            Boolean(
              (permisosLocales as any)[permiso]
            );


          if (permitido) {

            return of(true);

          }


          return of(
            router.createUrlTree([
              '/dashboard'
            ])
          );

        })

      );

  };

};
