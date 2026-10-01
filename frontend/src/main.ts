// Guarda el preapproval_id que devuelve Mercado Pago antes de iniciar Angular
try {
  const pid = new URLSearchParams(window.location.search).get('preapproval_id');
  if (pid) {
    sessionStorage.setItem('mp_preapproval_id', pid);
    window.location.hash = '#/suscripcion';
  }
} catch {}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
