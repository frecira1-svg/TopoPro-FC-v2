import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth.service';


export const authGuard: CanActivateFn = (
  route,
  state
) => {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);


  // ==========================================================
  // USUARIO AUTENTICADO
  // ==========================================================

  if (authService.estaAutenticado()) {

    return true;

  }


  // ==========================================================
  // USUARIO NO AUTENTICADO
  // ==========================================================
  //
  // Guardamos la URL que el usuario estaba intentando abrir.
  //
  // Ejemplo:
  //
  // /suscripcion
  //
  // Después del login podremos regresar exactamente allí.
  //

  return router.createUrlTree(
    ['/login'],
    {
      queryParams: {
        returnUrl: state.url
      }
    }
  );

};
