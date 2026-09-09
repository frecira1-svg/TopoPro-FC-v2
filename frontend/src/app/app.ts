import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { Navbar } from './layout/components/navbar/navbar';
import { Sidebar } from './layout/components/sidebar/sidebar';
import { ThemeService } from './core/services/theme.service';

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

  mostrarLayout = false;

  private rutasPublicas = [
    '/',
    '/login',
    '/registro',
    '/correo-verificado',
    '/publicaciones',
    '/directorio',
    '/perfil-publico'
  ];

  constructor() {

    this.actualizarLayout(this.router.url);

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(event => {
        this.actualizarLayout(event.urlAfterRedirects);
      });

  }

  private actualizarLayout(url: string): void {

    const ruta = url.split('?')[0].split('#')[0];

    this.mostrarLayout = !this.rutasPublicas.some(rutaPublica => {

      if (rutaPublica === '/') {
        return ruta === '/';
      }

      return ruta === rutaPublica ||
             ruta.startsWith(`${rutaPublica}/`);

    });

  }

}
