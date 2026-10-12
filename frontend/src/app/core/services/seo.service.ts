
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private readonly dominio = 'https://topopro-fc.com';

  private readonly paginas: Record<string, {
    titulo: string;
    descripcion: string;
  }> = {
    '/': {
      titulo: 'TopoPro FC | Software de gestión topográfica',
      descripcion: 'Gestiona proyectos topográficos, clientes y puntos de levantamiento con TopoPro FC.'
    },
    '/directorio': {
      titulo: 'Directorio de profesionales de topografía | TopoPro FC',
      descripcion: 'Encuentra profesionales de topografía, GNSS, RTK, nivelación, fotogrametría y cartografía.'
    },
    '/publicaciones': {
      titulo: 'Trabajos y publicaciones de topografía | TopoPro FC',
      descripcion: 'Explora trabajos, experiencias y publicaciones compartidas por profesionales de la topografía.'
    }
  };


iniciar(): void {
  const actualizarSeo = (url: string): void => {
    const ruta = url.split('?')[0].split('#')[0] || '/';
    const pagina = this.paginas[ruta];

    if (!pagina) {
      return;
    }

    const canonica = `${this.dominio}${ruta === '/' ? '/' : ruta}`;

    this.title.setTitle(pagina.titulo);

    this.meta.updateTag({
      name: 'description',
      content: pagina.descripcion
    });

    this.meta.updateTag({
      property: 'og:title',
      content: pagina.titulo
    });

    this.meta.updateTag({
      property: 'og:description',
      content: pagina.descripcion
    });

    this.meta.updateTag({
      property: 'og:url',
      content: canonica
    });

    let enlace = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );

    if (!enlace) {
      enlace = document.createElement('link');
      enlace.rel = 'canonical';
      document.head.appendChild(enlace);
    }

    enlace.href = canonica;
  };

  // Actualizar también la página inicial.
  actualizarSeo(this.router.url);

  // Actualizar cuando el usuario navegue a otra ruta.
  this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(event => {
      actualizarSeo((event as NavigationEnd).urlAfterRedirects);
    });
}
}
