import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { map } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { PermisoService } from '../services/permiso.service';


export const permisoGuard = (
  permiso: string
): CanActivateFn => {

  return () => {

    const authService = inject(AuthService);
    const permisoService = inject(PermisoService);
    const router = inject(Router);

    const usuario = authService.usuarioActual();

    if (!usuario) {
      return router.createUrlTree(['/login']);
    }

    if (usuario.rol === 'ADMIN') {
      return true;
    }

    return permisoService
      .obtenerMisPermisos()
      .pipe(

        map((permisos) => {

          const permitido =
            Boolean(
              (permisos as any)[permiso]
            );

          if (permitido) {
            return true;
          }

          return router.createUrlTree(['/dashboard']);

        })

      );

  };

};
