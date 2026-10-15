import {
  AfterViewInit,
  Component,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { finalize } from 'rxjs';

import { Proyecto } from '../../../../core/models/proyecto.model';
import { ProyectoService } from '../../../../core/services/proyecto.service';

import { PuntoTopografico } from '../../../../core/models/punto.model';
import { PuntoService } from '../../../../core/services/punto.service';
import { PuntoRedPasivaIGAC } from '../../../../core/models/red-pasiva-igac.model';
import { RedPasivaIGACService } from '../../../../core/services/red-pasiva-igac.service';


@Component({
  selector: 'app-mapas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapas.html',
  styleUrl: './mapas.css'
})
export class Mapas implements AfterViewInit, OnDestroy {

  private mapa!: L.Map;

  private marcadoresProyectos: L.Marker[] = [];

  private marcadoresPuntos: L.CircleMarker[] = [];
  private marcadoresIGAC: L.CircleMarker[] = [];

  puntosIGAC: PuntoRedPasivaIGAC[] = [];

  igacVisibles = true;
  cargandoIGAC = false;
  errorIGAC = '';
  radioIGACKm = 10;

  proyectos: Proyecto[] = [];

  puntos: PuntoTopografico[] = [];

  cargando = true;

  error = '';


  // ==========================================
  // VISIBILIDAD DE CAPAS
  // ==========================================

  proyectosVisibles = true;

  puntosVisibles = true;


  constructor(
    private proyectoService: ProyectoService,
    private puntoService: PuntoService,
    private redPasivaIGACService: RedPasivaIGACService
  ) {}


  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  ngAfterViewInit(): void {
    this.inicializarMapa();
    this.cargarDatos();
    setTimeout(() => {
      if (this.mapa) {
        this.mapa.invalidateSize();
      }
    }, 300);
  }


  // ==========================================
  // DESTRUCCIÓN
  // ==========================================

  ngOnDestroy(): void {

    if (this.mapa) {

      this.mapa.remove();

    }

  }


  private inicializarMapa(): void {

// ==========================================
// CONFIGURACIÓN DE ICONOS DE LEAFLET
// ==========================================

const iconDefault = L.icon({

  iconRetinaUrl:
    '/assets/leaflet/marker-icon-2x.png',

  iconUrl:
    '/assets/leaflet/marker-icon.png',

  shadowUrl:
    '/assets/leaflet/marker-shadow.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]

});

L.Marker.prototype.options.icon = iconDefault;

    // Crear mapa

    this.mapa = L.map('mapaGeneral', {

      center: [6.2442, -75.5812],

      zoom: 12

    });


    // Mapa base

    L.tileLayer(

      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

      {

        attribution:
          '&copy; OpenStreetMap contributors'

      }

    ).addTo(this.mapa);

  }


  // ==========================================
  // CARGAR DATOS
  // ==========================================

  private cargarDatos(): void {

    this.cargando = true;

    this.error = '';


    this.proyectoService.obtenerTodos().subscribe({

      next: (proyectos) => {

        this.proyectos = proyectos;

        this.agregarProyectosAlMapa();

        this.cargarPuntos();

      },

      error: (error) => {

        console.error(
          'Error cargando proyectos:',
          error
        );

        this.error =
          'No fue posible cargar los proyectos.';

        this.cargando = false;

      }

    });

  }


  // ==========================================
  // CARGAR PUNTOS
  // ==========================================

  private cargarPuntos(): void {

    this.puntoService.obtenerTodos().subscribe({

      next: (puntos) => {

        this.puntos = puntos;

        this.agregarPuntosAlMapa();

        this.ajustarMapa();

        this.cargando = false;

      },

      error: (error) => {

        console.error(
          'Error cargando puntos:',
          error
        );

        this.error =
          'No fue posible cargar los puntos topográficos.';

        this.cargando = false;

      }

    });

  }


  // ==========================================
  // AGREGAR PROYECTOS
  // ==========================================

  private agregarProyectosAlMapa(): void {

    for (const proyecto of this.proyectos) {

      if (
        proyecto.latitud == null ||
        proyecto.longitud == null
      ) {

        continue;

      }


      const marker = L.marker([

        proyecto.latitud,
        proyecto.longitud

      ]);


      const contenido =

        '<div style="min-width:220px">' +

        '<strong>📍 ' +

        this.escapeHtml(proyecto.nombre || 'Sin nombre') +

        '</strong>' +

        '<br><br>' +

        '<strong>Ubicación:</strong><br>' +

        this.escapeHtml(proyecto.ubicacion || '-') +

        '<br><br>' +

        '<strong>Cliente:</strong><br>' +

        this.escapeHtml(proyecto.cliente || '-') +

        '<br><br>' +

        '<strong>Estado:</strong><br>' +

        this.escapeHtml(proyecto.estado || '-') +

        '</div>';


      marker.bindPopup(contenido);


      if (this.proyectosVisibles) {

        marker.addTo(this.mapa);

      }


      this.marcadoresProyectos.push(marker);

    }

  }


 // ==========================================
// AGREGAR PUNTOS
// ==========================================

private agregarPuntosAlMapa(): void {

  for (const punto of this.puntos) {

    if (
      punto.latitud == null ||
      punto.longitud == null
    ) {
      continue;
    }


    const marker = L.circleMarker(

      [
        punto.latitud,
        punto.longitud
      ],

      {
        radius: 7,
        fillOpacity: 0.85,
        weight: 2
      }

    );


    // ==========================================
    // OBTENER NOMBRE DEL PROYECTO
    // ==========================================

    const nombreProyectoPunto =
      this.proyectos.find(
        p => p.id === punto.proyectoId
      )?.nombre
      || `Proyecto #${punto.proyectoId}`;


    // ==========================================
    // CONTENIDO DEL POPUP
    // ==========================================

    const contenido =

      '<div style="min-width:240px">' +

      '<strong>📍 Punto topográfico</strong>' +

      '<br><br>' +

      '<strong>Código:</strong><br>' +

      this.escapeHtml(punto.codigo || '-') +

      '<br><br>' +

      '<strong>Descripción:</strong><br>' +

      this.escapeHtml(punto.descripcion || '-') +

      '<br><br>' +

      '<strong>Norte:</strong><br>' +

      this.escapeHtml(punto.norte) +

      '<br><br>' +

      '<strong>Este:</strong><br>' +

      this.escapeHtml(punto.este) +

      '<br><br>' +

      '<strong>Elevación:</strong><br>' +

      this.escapeHtml(punto.elevacion) +

      ' m' +

      '<br><br>' +

      '<strong>Proyecto:</strong><br>' +

      this.escapeHtml(nombreProyectoPunto) +

      '</div>';


    marker.bindPopup(contenido);


    // ==========================================
    // MOSTRAR EN EL MAPA
    // ==========================================

    if (this.puntosVisibles) {

      marker.addTo(this.mapa);

    }


    this.marcadoresPuntos.push(marker);

  }

}

  // ==========================================
  // MOSTRAR / OCULTAR PROYECTOS
  // ==========================================

  mostrarProyectos(): void {

    this.proyectosVisibles =
      !this.proyectosVisibles;


    for (const marcador of this.marcadoresProyectos) {

      if (this.proyectosVisibles) {

        marcador.addTo(this.mapa);

      } else {

        marcador.remove();

      }

    }

  }


  // ==========================================
  // MOSTRAR / OCULTAR PUNTOS
  // ==========================================

  mostrarPuntos(): void {

    this.puntosVisibles =
      !this.puntosVisibles;


    for (const marcador of this.marcadoresPuntos) {

      if (this.puntosVisibles) {

        marcador.addTo(this.mapa);

      } else {

        marcador.remove();

      }

    }

  }


  // ==========================================
  // ==========================================
  // RED PASIVA IGAC
  // ==========================================

  cambiarRadioIGAC(evento: Event): void {
    const valor = Number((evento.target as HTMLSelectElement).value);
    const radiosPermitidos = [5, 10, 25, 50, 100, 200];

    if (radiosPermitidos.includes(valor)) {
      this.radioIGACKm = valor;
    }
  }

  cargarPuntosIGACCercanos(): void {
    if (!this.mapa || this.cargandoIGAC) {
      return;
    }

    const centro = this.mapa.getCenter();

    this.cargandoIGAC = true;
    this.errorIGAC = '';

    this.redPasivaIGACService.obtenerCercanos(
      centro.lat,
      centro.lng,
      this.radioIGACKm,
      100
    ).pipe(
     finalize(() => {
  this.cargandoIGAC = false;
})
    ).subscribe({
      next: (respuesta) => {
        for (const marcador of this.marcadoresIGAC) {
          marcador.remove();
        }

        this.marcadoresIGAC = [];
        this.puntosIGAC = respuesta.datos ?? [];

        for (const punto of this.puntosIGAC) {
          const marcador = L.circleMarker(
            [punto.latitud, punto.longitud],
            {
              radius: 6,
              color: '#7c3aed',
              fillColor: '#a78bfa',
              fillOpacity: 0.9,
              weight: 2
            }
          );

          const altura = punto.alturaElipsoidal != null
            ? `${punto.alturaElipsoidal.toFixed(3)} m`
            : 'No disponible';

          const distancia = punto.distanciaKm != null
            ? `${punto.distanciaKm.toFixed(3)} km`
            : 'No disponible';


const popup = `
  <div class="popup-igac">
    <strong>Red Pasiva IGAC</strong><br>
    <strong>Nomenclatura:</strong> ${this.escapeHtml(punto.nomenclatura)}<br>
    <strong>Municipio:</strong> ${this.escapeHtml(punto.municipio)}<br>
    <strong>Departamento:</strong> ${this.escapeHtml(punto.departamento)}<br>
    <strong>Latitud:</strong> ${Number(punto.latitud).toFixed(8)}<br>
    <strong>Longitud:</strong> ${Number(punto.longitud).toFixed(8)}<br>
    <button type="button"
      class="btn-copiar-coordenadas"
      data-latitud="${Number(punto.latitud).toFixed(8)}"
      data-longitud="${Number(punto.longitud).toFixed(8)}">
      Copiar coordenadas
    </button>
    <button type="button"
      class="btn-ver-en-mapa"
      data-latitud="${Number(punto.latitud).toFixed(8)}"
      data-longitud="${Number(punto.longitud).toFixed(8)}">
      Ver en el mapa
    </button><br>
    <strong>Estado:</strong> ${this.escapeHtml(punto.estado || 'No disponible')}<br>
    <strong>Altura elipsoidal:</strong> ${altura}<br>
    <strong>Distancia:</strong> ${distancia}
  </div>
`;


          marcador.bindPopup(popup);

          marcador.on('popupopen', (evento) => {
            const contenedor = evento.popup.getElement();
            const boton = contenedor?.querySelector<HTMLButtonElement>(
              '.btn-copiar-coordenadas'
            );

            if (!boton || boton.dataset['eventoCopiar'] === '1') {
              return;
            }

            boton.dataset['eventoCopiar'] = '1';

            const botonVer = contenedor?.querySelector<HTMLButtonElement>(
              '.btn-ver-en-mapa'
            );

            if (botonVer && botonVer.dataset['eventoVer'] !== '1') {
              botonVer.dataset['eventoVer'] = '1';

              botonVer.addEventListener('click', () => {
                const latitud = Number(botonVer.dataset['latitud']);
                const longitud = Number(botonVer.dataset['longitud']);

                if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
                  return;
                }

                this.mapa.setView([latitud, longitud], 18, {
                  animate: true
                });
              });
            }

            boton.addEventListener('click', async () => {
              const latitud = boton.dataset['latitud'];
              const longitud = boton.dataset['longitud'];

              if (!latitud || !longitud) {
                return;
              }

              const coordenadas = `${latitud}, ${longitud}`;

              try {
                await navigator.clipboard.writeText(coordenadas);
                boton.textContent = '¡Coordenadas copiadas!';
              } catch (error) {
                console.error('No fue posible copiar las coordenadas:', error);
                boton.textContent = 'No se pudo copiar';
              }
            });
          });

          if (this.igacVisibles) {
            marcador.addTo(this.mapa);
          }

          this.marcadoresIGAC.push(marcador);
        }

        this.ajustarMapa();
      },
      error: (error) => {
        console.error('Error consultando la Red Pasiva IGAC:', error);
        this.errorIGAC =
          'No fue posible cargar los puntos IGAC. Comprueba tu sesión y vuelve a intentarlo.';
      }
    });
  }
  mostrarIGAC(): void {
    this.igacVisibles = !this.igacVisibles;

    for (const marcador of this.marcadoresIGAC) {
      if (this.igacVisibles) {
        marcador.addTo(this.mapa);
      } else {
        marcador.remove();
      }
    }

    this.ajustarMapa();
  }
  // AJUSTAR MAPA
  // ==========================================

  private ajustarMapa(): void {

    const elementos: L.Layer[] = [

      ...(this.proyectosVisibles
        ? this.marcadoresProyectos
        : []),

      ...(this.puntosVisibles
        ? this.marcadoresPuntos
        : []),

      ...(this.igacVisibles
        ? this.marcadoresIGAC
        : [])

    ];


    if (elementos.length === 0) {

      return;

    }


    const grupo =
      L.featureGroup(elementos);


    this.mapa.fitBounds(

      grupo.getBounds(),

      {

        padding: [40, 40]

      }

    );

  }


  // ==========================================
  // ==========================================
  // RED PASIVA IGAC
  // ==========================================

  ajustarMapaPublico(): void {

    this.ajustarMapa();

  }


  // ==========================================
  // SELECCIONAR PROYECTO
  // ==========================================

  seleccionarProyecto(event: Event): void {

    const select =
      event.target as HTMLSelectElement;


    const id =
      Number(select.value);


    if (!id) {

      this.ajustarMapa();

      return;

    }


    const proyecto =
      this.proyectos.find(
        p => p.id === id
      );


    if (!proyecto) {

      return;

    }


    this.centrarProyecto(proyecto);

  }


  // ==========================================
  // CENTRAR PROYECTO
  // ==========================================

  centrarProyecto(proyecto: Proyecto): void {

    if (
      proyecto.latitud == null ||
      proyecto.longitud == null
    ) {

      return;

    }


    this.mapa.setView(

      [

        proyecto.latitud,

        proyecto.longitud

      ],

      15

    );


    const marcador =
      this.marcadoresProyectos.find(

        marker => {

          const posicion =
            marker.getLatLng();

          return (

            posicion.lat === proyecto.latitud &&

            posicion.lng === proyecto.longitud

          );

        }

      );


    if (marcador) {

      marcador.openPopup();

    }

  }


  // ==========================================
  // LIMPIAR MARCADORES
  // ==========================================

  limpiarMarcadores(): void {

    for (
      const marcador
      of this.marcadoresProyectos
    ) {

      marcador.remove();

    }


    for (
      const marcador
      of this.marcadoresPuntos
    ) {

      marcador.remove();

    }


    this.marcadoresProyectos = [];

    this.marcadoresPuntos = [];

  }


  // ==========================================
  // RECARGAR
  // ==========================================

  recargar(): void {

    this.limpiarMarcadores();

    this.cargarDatos();

  }


  // ==========================================
  // TOTAL PROYECTOS
  // ==========================================

  get totalProyectos(): number {

    return this.proyectos.filter(

      proyecto =>

        proyecto.latitud != null &&

        proyecto.longitud != null

    ).length;

  }


  // ==========================================
  // TOTAL PUNTOS
  // ==========================================

  get totalPuntos(): number {

    return this.puntos.filter(

      punto =>

        punto.latitud != null &&

        punto.longitud != null

    ).length;

  }


  // ==========================================
  // ESCAPAR HTML (prevención XSS en popups)
  // ==========================================

  private escapeHtml(valor: any): string {

    if (valor === null || valor === undefined) {
      return '';
    }

    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }

}
