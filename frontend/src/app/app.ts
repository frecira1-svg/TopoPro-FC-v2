import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { Navbar } from './layout/components/navbar/navbar';
import { Sidebar } from './layout/components/sidebar/sidebar';
import { ThemeService } from './core/services/theme.service';
import { OfflineDbService } from './core/services/offline/offline-db.service';
import { OfflineSyncService } from './core/services/offline/offline-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Navbar,
    Sidebar
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected readonly title = signal('TopoPro');

  private themeService = inject(ThemeService);
  private router = inject(Router);
  private offlineDbService = inject(OfflineDbService);
  private offlineSyncService = inject(OfflineSyncService);

  mostrarLayout = false;

  private rutasPublicas = [
    '/',
    '/login',
    '/registro',
    '/correo-verificado',
    '/directorio',
    '/perfil-publico'
  ];

  constructor() {

    // =====================================================
    // INICIALIZAR BASE DE DATOS OFFLINE
    // =====================================================

    this.offlineDbService
      .inicializar()
      .then(() => {

        if (navigator.onLine) {
          this.sincronizarPendientes();
        }

      })
      .catch(error => {

        console.error(
          'Error al inicializar la base de datos offline:',
          error
        );

      });


    // =====================================================
    // DETECTAR CUANDO VUELVE INTERNET
    // =====================================================

    window.addEventListener(
      'online',
      () => {

        console.log(
          'Conexión restablecida. Iniciando sincronización...'
        );

        this.sincronizarPendientes();

      }
    );


    // =====================================================
    // LAYOUT
    // =====================================================

    this.actualizarLayout(
      this.router.url
    );


    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(event => {

        this.actualizarLayout(
          event.urlAfterRedirects
        );

      });

  }


  // =====================================================
  // SINCRONIZAR PENDIENTES
  // =====================================================

  private sincronizarPendientes(): void {

    this.offlineSyncService
      .sincronizar()
      .catch(error => {

        console.error(
          'Error durante la sincronización offline:',
          error
        );

      });

  }


  // =====================================================
  // ACTUALIZAR LAYOUT
  // =====================================================

  private actualizarLayout(
    url: string
  ): void {

    const ruta =
      url
        .split('?')[0]
        .split('#')[0];


    // =====================================================
    // PUBLICACIONES
    // =====================================================
    //
    // Publicaciones tiene doble comportamiento:
    //
    // 1. Usuario autenticado:
    //    Navbar + Sidebar visibles.
    //
    // 2. Usuario no autenticado:
    //    Página pública sin Sidebar.
    //
    // =====================================================

    if (ruta === '/publicaciones') {

      const usuarioAutenticado =
        localStorage.getItem('topopro_token') !== null;

      this.mostrarLayout = usuarioAutenticado;

      return;
    }


    // =====================================================
    // RESTO DE RUTAS
    // =====================================================

    this.mostrarLayout =
      !this.rutasPublicas.some(
        rutaPublica => {

          if (rutaPublica === '/') {

            return ruta === '/';

          }

          return ruta === rutaPublica ||
                 ruta.startsWith(
                   `${rutaPublica}/`
                 );

        }
      );

  }

}
