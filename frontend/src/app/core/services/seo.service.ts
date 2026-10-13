
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


actualizarPerfilPublico(datos: {
  id: number;
  nombre: string;
  apellido?: string | null;
  profesion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
}): void {
  const nombreCompleto =
    `${datos.nombre} ${datos.apellido ?? ''}`.trim() ||
    'Profesional de topografía';

  const profesion = datos.profesion?.trim();
  const ubicacion = [datos.ciudad, datos.pais]
    .filter((valor): valor is string => !!valor?.trim())
    .join(', ');

  const titulo = [
    nombreCompleto,
    profesion,
    'TopoPro FC'
  ].filter(Boolean).join(' | ');

  const descripcion =
    `Perfil profesional de ${nombreCompleto}` +
    `${profesion ? `, ${profesion}` : ''}` +
    `${ubicacion ? ` en ${ubicacion}` : ''}. ` +
    'Consulta sus trabajos y publicaciones en TopoPro FC.';

  const canonica =
    `${this.dominio}/perfil-publico/${datos.id}`;

  this.title.setTitle(titulo);

  this.meta.updateTag({
    name: 'description',
    content: descripcion.slice(0, 160)
  });

  this.meta.updateTag({
    property: 'og:title',
    content: titulo
  });

  this.meta.updateTag({
    property: 'og:description',
    content: descripcion.slice(0, 160)
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

  console.log('[SEO] Perfil público actualizado:', canonica);
}


  private readonly paginas: Record<string, {
    titulo: string;
    descripcion: string;
  }> = {
    '/': {
      titulo: 'TopoPro FC | Software de gestión topográfica',
      descripcion:
        'Gestiona proyectos topográficos, clientes y puntos de levantamiento con TopoPro FC.'
    },
    '/directorio': {
      titulo: 'Directorio de profesionales de topografía | TopoPro FC',
      descripcion:
        'Encuentra profesionales de topografía, GNSS, RTK, nivelación, fotogrametría y cartografía.'
    },
    '/publicaciones': {
      titulo: 'Trabajos y publicaciones de topografía | TopoPro FC',
      descripcion:
        'Explora trabajos, experiencias y publicaciones compartidas por profesionales de la topografía.'
    }
  };

  iniciar(): void {
    console.log(
      '[SEO] Servicio iniciado. URL del router:',
      this.router.url
    );

    const actualizarSeo = (url: string): void => {
      const ruta = url.split('?')[0].split('#')[0] || '/';
      const pagina = this.paginas[ruta];

      console.log('[SEO] Ruta recibida:', ruta);

      if (!pagina) {
        console.warn('[SEO] No hay metadatos configurados para:', ruta);
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

      console.log('[SEO] Título aplicado:', document.title);
      console.log('[SEO] Canonical aplicado:', enlace.href);
    };

    // Actualizar los metadatos de la ruta inicial.
    actualizarSeo(this.router.url);

    // Actualizar los metadatos después de cada navegación.
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        const url = (event as NavigationEnd).urlAfterRedirects;

        console.log('[SEO] Navegación detectada:', url);

        actualizarSeo(url);
      });
  }
}
