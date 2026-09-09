import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import * as L from 'leaflet';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import {
  ConfirmationService,
  MessageService
} from 'primeng/api';

import { PuntoService } from '../../../../core/services/punto.service';

import {
  PuntoTopografico,
  PuntoTopograficoRequest
} from '../../../../core/models/punto.model';


@Component({
  selector: 'app-puntos-general',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ConfirmDialogModule,
    ToastModule
  ],

  providers: [
    ConfirmationService,
    MessageService
  ],

  templateUrl: './puntos-general.html',
  styleUrl: './puntos-general.css'
})
export class PuntosGeneral implements OnInit, OnDestroy {

  // =====================================================
  // DATOS
  // =====================================================

  puntos = signal<PuntoTopografico[]>([]);

  cargando = signal(false);

  dialogoVisible = signal(false);

  modoEdicion = signal(false);

  importando = signal(false);


  // =====================================================
  // FILTROS
  // =====================================================

  busqueda = signal('');

  proyectoSeleccionado = signal<number | null>(null);


  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  totalPuntos = computed(() =>
    this.puntosFiltrados().length
  );


  totalGeorreferenciados = computed(() =>
    this.puntosFiltrados().filter(
      punto =>
        punto.latitud != null &&
        punto.longitud != null
    ).length
  );


  elevacionPromedio = computed(() => {

    const lista = this.puntosFiltrados();

    if (!lista.length) {
      return 0;
    }

    const elevaciones = lista
      .map(p => Number(p.elevacion))
      .filter(Number.isFinite);

    if (!elevaciones.length) {
      return 0;
    }

    const suma = elevaciones.reduce(
      (total, valor) => total + valor,
      0
    );

    return Number(
      (suma / elevaciones.length).toFixed(2)
    );

  });


  // =====================================================
  // PUNTOS FILTRADOS
  // =====================================================

  puntosFiltrados = computed(() => {

    const texto =
      this.busqueda()
        .trim()
        .toLowerCase();

    const proyectoId =
      this.proyectoSeleccionado();

    return this.puntos().filter(punto => {

      const coincideBusqueda =
        !texto ||
        punto.codigo?.toLowerCase().includes(texto) ||
        punto.tipo?.toLowerCase().includes(texto) ||
        punto.descripcion?.toLowerCase().includes(texto);

      const coincideProyecto =
        proyectoId === null ||
        Number(punto.proyectoId) === proyectoId;

      return coincideBusqueda && coincideProyecto;

    });

  });


  // =====================================================
  // PROYECTOS
  // =====================================================

  proyectos = computed(() => {

    const mapa = new Map<number, any>();

    this.puntos().forEach(punto => {

      if (
        punto.proyecto &&
        !mapa.has(punto.proyecto.id)
      ) {

        mapa.set(
          punto.proyecto.id,
          punto.proyecto
        );

      }

    });

    return Array.from(mapa.values())
      .sort((a, b) =>
        String(a.nombre || '')
          .localeCompare(
            String(b.nombre || '')
          )
      );

  });


  // =====================================================
  // FORMULARIO
  // =====================================================

  puntoActual: PuntoTopograficoRequest =
    this.formularioVacio();

  idEnEdicion: number | null = null;


  // =====================================================
  // MAPA
  // =====================================================

  private mapa: L.Map | null = null;

  private marcadores: L.Marker[] = [];


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private puntoService: PuntoService,

    private confirmationService:
      ConfirmationService,

    private messageService:
      MessageService,

    private router: Router
  ) {}


  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  ngOnInit(): void {

    this.cargarPuntos();

  }


  ngOnDestroy(): void {

    if (this.mapa) {

      this.mapa.remove();

      this.mapa = null;

    }

  }


  // =====================================================
  // INICIALIZAR MAPA
  // =====================================================

  inicializarMapa(): void {

    if (this.mapa) {
      return;
    }

    this.configurarIconosLeaflet();

    this.mapa =
      L.map('mapaPuntosGeneral')
        .setView(
          [6.2442, -75.5812],
          13
        );


    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.mapa);


    this.pintarMarcadores(
      this.puntosFiltrados()
    );

  }


  // =====================================================
  // ICONOS LEAFLET
  // =====================================================

  private configurarIconosLeaflet(): void {

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


    L.Marker.prototype.options.icon =
      iconDefault;

  }


  // =====================================================
  // CARGAR TODOS LOS PUNTOS
  // =====================================================

  cargarPuntos(): void {

    this.cargando.set(true);

    this.puntoService
      .obtenerTodos()
      .subscribe({

        next: (data) => {

          this.puntos.set(data);

          this.cargando.set(false);

          setTimeout(() => {

            this.inicializarMapa();

            this.pintarMarcadores(
              this.puntosFiltrados()
            );

          });

        },

        error: (error) => {

          console.error(
            'Error cargando puntos:',
            error
          );

          this.cargando.set(false);

          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No se pudieron cargar los puntos.'

          });

        }

      });

  }


  // =====================================================
  // PINTAR MARCADORES
  // =====================================================

  private pintarMarcadores(
    puntos: PuntoTopografico[]
  ): void {

    if (!this.mapa) {
      return;
    }


    this.marcadores.forEach(
      marcador =>
        marcador.remove()
    );

    this.marcadores = [];


    const georreferenciados =
      puntos.filter(
        punto =>
          punto.latitud != null &&
          punto.longitud != null
      );


    georreferenciados.forEach(
      punto => {

        const marcador =
          L.marker([
            punto.latitud!,
            punto.longitud!
          ])
            .addTo(this.mapa!)
            .bindPopup(
              this.crearPopup(punto)
            );


        marcador.bindTooltip(
          punto.codigo || 'Punto',
          {
            direction: 'top',
            offset: [0, -40],
            opacity: 0.9
          }
        );


        marcador.on(
          'click',
          () => {

            this.resaltarPunto(punto);

          }
        );


        this.marcadores.push(
          marcador
        );

      }
    );


    if (this.marcadores.length > 0) {

      const grupo =
        L.featureGroup(
          this.marcadores
        );

      this.mapa.fitBounds(
        grupo.getBounds(),
        {
          padding: [40, 40],
          maxZoom: 17
        }
      );

    }

  }


  // =====================================================
  // POPUP
  // =====================================================

  private crearPopup(
    punto: PuntoTopografico
  ): string {

    const nombreProyecto =
      punto.proyecto?.nombre ||
      'Sin proyecto';

    return `

      <div
        style="
          min-width:240px;
          font-family:Arial,sans-serif;
        "
      >

        <div
          style="
            font-size:16px;
            font-weight:bold;
            margin-bottom:10px;
          "
        >
          📍 ${this.escapeHtml(
            punto.codigo || 'Sin código'
          )}
        </div>

        <div
          style="
            border-top:1px solid #ddd;
            padding-top:8px;
          "
        >

          <strong>Proyecto:</strong>
          ${this.escapeHtml(nombreProyecto)}

          <br><br>

          <strong>Elevación:</strong>
          ${punto.elevacion ?? '-'} m

          <br><br>

          <strong>Norte:</strong>
          ${punto.norte ?? '-'}

          <br><br>

          <strong>Este:</strong>
          ${punto.este ?? '-'}

          <br><br>

          <strong>Tipo:</strong>
          ${this.escapeHtml(
            punto.tipo || '-'
          )}

        </div>

      </div>

    `;

  }


  // =====================================================
  // ESCAPAR HTML
  // =====================================================

  private escapeHtml(
    valor: string
  ): string {

    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  // =====================================================
  // LOCALIZAR
  // =====================================================

  localizarPunto(
    punto: PuntoTopografico
  ): void {

    if (
      punto.latitud == null ||
      punto.longitud == null
    ) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Sin ubicación',

        detail:
          'Este punto no tiene coordenadas geográficas.'

      });

      return;

    }


    if (!this.mapa) {
      return;
    }


    this.mapa.setView(

      [
        punto.latitud,
        punto.longitud
      ],

      18,

      {
        animate: true
      }

    );


    const marcador =
      this.marcadores.find(
        marker => {

          const posicion =
            marker.getLatLng();

          return (
            Math.abs(
              posicion.lat -
              punto.latitud!
            ) < 0.000001 &&

            Math.abs(
              posicion.lng -
              punto.longitud!
            ) < 0.000001
          );

        }
      );


    if (marcador) {

      marcador.openPopup();

    }

  }


  // =====================================================
  // RESALTAR
  // =====================================================

  private resaltarPunto(
    punto: PuntoTopografico
  ): void {

    this.localizarPunto(punto);

  }


  // =====================================================
  // NUEVO
  // =====================================================

  abrirNuevo(): void {

    if (!this.proyectos().length) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Sin proyectos',

        detail:
          'Debes tener al menos un proyecto para crear un punto.'

      });

      return;

    }


    this.modoEdicion.set(false);

    this.idEnEdicion = null;

    this.puntoActual =
      this.formularioVacio();

    this.dialogoVisible.set(true);

  }


  // =====================================================
  // EDITAR
  // =====================================================

  abrirEdicion(
    punto: PuntoTopografico
  ): void {

    this.modoEdicion.set(true);

    this.idEnEdicion =
      punto.id;


    this.puntoActual = {

      proyectoId:
        punto.proyectoId,

      codigo:
        punto.codigo,

      norte:
        punto.norte,

      este:
        punto.este,

      elevacion:
        punto.elevacion,

      descripcion:
        punto.descripcion,

      tipo:
        punto.tipo,

      precision:
        punto.precision,

      equipo:
        punto.equipo,

      metodo:
        punto.metodo,

      observaciones:
        punto.observaciones,

      latitud:
        punto.latitud,

      longitud:
        punto.longitud

    };


    this.dialogoVisible.set(true);

  }


  // =====================================================
  // GUARDAR
  // =====================================================

  guardar(): void {

    if (
      !this.puntoActual.proyectoId ||
      !this.puntoActual.codigo ||
      this.puntoActual.norte == null ||
      this.puntoActual.este == null ||
      this.puntoActual.elevacion == null
    ) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Datos incompletos',

        detail:
          'Proyecto, código, norte, este y elevación son obligatorios.'

      });

      return;

    }


    const peticion =
      this.modoEdicion() &&
      this.idEnEdicion

        ? this.puntoService.actualizar(
            this.idEnEdicion,
            this.puntoActual
          )

        : this.puntoService.crear(
            this.puntoActual
          );


    peticion.subscribe({

      next: () => {

        this.messageService.add({

          severity: 'success',

          summary: 'Proceso exitoso',

          detail:
            this.modoEdicion()
              ? 'Punto actualizado correctamente.'
              : 'Punto creado correctamente.'

        });


        this.dialogoVisible.set(false);

        this.cargarPuntos();

      },


      error: (error) => {

        console.error(
          'Error guardando punto:',
          error
        );

        this.messageService.add({

          severity: 'error',

          summary: 'Error',

          detail:
            error?.error?.error ||
            'No fue posible guardar el punto.'

        });

      }

    });

  }


  // =====================================================
  // CONFIRMAR ELIMINACIÓN
  // =====================================================

  confirmarEliminar(
    punto: PuntoTopografico
  ): void {

    this.confirmationService.confirm({

      message:
        `¿Deseas eliminar el punto "${punto.codigo}"?`,

      header:
        'Eliminar punto',

      icon:
        'pi pi-exclamation-triangle',

      accept: () =>
        this.eliminar(
          punto.id
        )

    });

  }


  // =====================================================
  // ELIMINAR
  // =====================================================

  eliminar(
    id: number
  ): void {

    this.puntoService
      .eliminar(id)
      .subscribe({

        next: () => {

          this.messageService.add({

            severity: 'success',

            summary: 'Eliminado',

            detail:
              'Punto eliminado correctamente.'

          });


          this.cargarPuntos();

        },


        error: (error) => {

          console.error(
            'Error eliminando punto:',
            error
          );

          this.messageService.add({

            severity: 'error',

            summary: 'Error',

            detail:
              error?.error?.error ||
              'No fue posible eliminar el punto.'

          });

        }

      });

  }


  // =====================================================
  // FILTROS
  // =====================================================

  cambiarBusqueda(
    valor: string
  ): void {

    this.busqueda.set(valor);

    setTimeout(() => {

      this.pintarMarcadores(
        this.puntosFiltrados()
      );

    });

  }


  cambiarProyecto(
    proyectoId: number | null
  ): void {

    this.proyectoSeleccionado.set(
      proyectoId
    );

    setTimeout(() => {

      this.pintarMarcadores(
        this.puntosFiltrados()
      );

    });

  }


  limpiarFiltros(): void {

    this.busqueda.set('');

    this.proyectoSeleccionado.set(null);

    setTimeout(() => {

      this.pintarMarcadores(
        this.puntosFiltrados()
      );

    });

  }


  // =====================================================
  // VER PROYECTO
  // =====================================================

  verProyecto(
    proyectoId: number
  ): void {

    this.router.navigate([
      '/proyectos',
      proyectoId,
      'puntos'
    ]);

  }


  // =====================================================
  // FORMULARIO VACÍO
  // =====================================================

  private formularioVacio():
    PuntoTopograficoRequest {

    return {

      proyectoId: 0,

      codigo:
        '',

      norte:
        0,

      este:
        0,

      elevacion:
        0,

      descripcion:
        '',

      tipo:
        '',

      precision:
        undefined,

      equipo:
        '',

      metodo:
        '',

      observaciones:
        '',

      latitud:
        undefined,

      longitud:
        undefined

    };

  }

}
