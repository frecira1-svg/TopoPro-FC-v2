import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import * as L from 'leaflet';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
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

import { AuthService } from '../../../../core/services/auth.service';


@Component({
  selector: 'app-puntos',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ConfirmDialogModule,
    ToastModule
  ],

  providers: [
    ConfirmationService,
    MessageService
  ],

  templateUrl: './puntos.html',
  styleUrl: './puntos.css'
})
export class Puntos
  implements OnInit, AfterViewInit, OnDestroy {

  // =====================================================
  // PROYECTO
  // =====================================================

  proyectoId!: number;


  // =====================================================
  // DATOS
  // =====================================================

  puntos = signal<PuntoTopografico[]>([]);

  cargando = signal(false);

  dialogoVisible = signal(false);

  modoEdicion = signal(false);

  importando = signal(false);


  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  totalPuntos = computed(() =>
    this.puntos().length
  );


  totalGeorreferenciados = computed(() =>
    this.puntos().filter(
      punto =>
        punto.latitud != null &&
        punto.longitud != null
    ).length
  );


  elevacionPromedio = computed(() => {

    const lista = this.puntos();

    if (!lista.length) {
      return 0;
    }

    const elevaciones = lista
      .map(p => Number(p.elevacion))
      .filter(Number.isFinite);

    if (!elevaciones.length) {
      return 0;
    }

    const suma =
      elevaciones.reduce(
        (total, valor) =>
          total + valor,
        0
      );

    return Number(
      (suma / elevaciones.length)
        .toFixed(2)
    );

  });


  // =====================================================
  // CONTEXTO COMERCIAL
  // =====================================================

  constructor(
    private route: ActivatedRoute,

    private puntoService: PuntoService,

    private confirmationService:
      ConfirmationService,

    private messageService:
      MessageService,

    public authService:
      AuthService
  ) {}


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

  private marcadores:
    L.Marker[] = [];


  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  ngOnInit(): void {

    this.proyectoId = Number(
      this.route.snapshot
        .paramMap
        .get('id')
    );

    this.puntoActual.proyectoId =
      this.proyectoId;

    if (!this.authService.comercialActual()) {
      this.authService.cargarContextoComercial();
    }

    this.cargarPuntos();

  }


  ngAfterViewInit(): void {

    this.configurarIconosLeaflet();

    this.inicializarMapa();

  }


  ngOnDestroy(): void {

    if (this.mapa) {

      this.mapa.remove();

      this.mapa = null;

    }

  }


  // =====================================================
  // COMERCIAL
  // =====================================================

  esAdminComercial(): boolean {

    return this.authService
      .comercialActual()
      ?.esAdmin ?? false;

  }


  nombrePlanActual(): string {

    const comercial =
      this.authService.comercialActual();

    if (!comercial) {
      return 'Cargando...';
    }

    if (comercial.esAdmin) {
      return 'Administrador';
    }

    return comercial.plan?.nombre ||
      'Primer proyecto gratis';

  }


  limitePuntos(): number | null {

    const comercial =
      this.authService.comercialActual();

    if (
      !comercial ||
      comercial.esAdmin
    ) {
      return null;
    }

    return comercial.plan?.maxPuntosProyecto ?? null;

  }


  puntosRestantes(): number | null {

    const limite =
      this.limitePuntos();

    if (limite === null) {
      return null;
    }

    return Math.max(
      0,
      limite - this.totalPuntos()
    );

  }


  puedeCrearPuntoPorPlan(): boolean {

    const comercial =
      this.authService.comercialActual();

    if (!comercial) {
      return true;
    }

    if (comercial.esAdmin) {
      return true;
    }

    const limite =
      comercial.plan?.maxPuntosProyecto;

    if (
      limite === null ||
      limite === undefined
    ) {
      return true;
    }

    return this.totalPuntos() < limite;

  }


  puedeImportarCSV(): boolean {

    return this.puedeCrearPuntoPorPlan();

  }


  textoLimitePuntos(): string {

    const comercial =
      this.authService.comercialActual();

    if (!comercial) {
      return 'Cargando límite...';
    }

    if (comercial.esAdmin) {
      return 'Acceso administrativo';
    }

    const limite =
      comercial.plan?.maxPuntosProyecto;

    if (
      limite === null ||
      limite === undefined
    ) {
      return 'Mayor capacidad';
    }

    return `${this.totalPuntos()} / ${limite}`;

  }

porcentajeUsoPuntos(): number {

  const limite = this.limitePuntos();

  if (limite === null || limite <= 0) {
    return 0;
  }

  return Math.min(
    100,
    (this.totalPuntos() / limite) * 100
  );

}

  mensajeLimitePuntos(): string {

    const comercial =
      this.authService.comercialActual();

    if (
      comercial &&
      comercial.esFree
    ) {

      return (
        `El proyecto gratuito permite máximo ` +
        `${comercial.plan?.maxPuntosProyecto ?? 500} ` +
        `puntos. Activa un plan para continuar.`
      );

    }

    return 'Has alcanzado el límite de puntos permitido por tu plan.';

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
  // INICIALIZAR MAPA
  // =====================================================

  private inicializarMapa(): void {

    this.mapa =
      L.map('mapaPuntos')
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


    if (this.puntos().length > 0) {

      this.pintarMarcadores(
        this.puntos()
      );

    }

  }


  // =====================================================
  // CARGAR PUNTOS
  // =====================================================

  cargarPuntos(): void {

    this.cargando.set(true);

    this.puntoService
      .obtenerPorProyecto(
        this.proyectoId
      )
      .subscribe({

        next: (data) => {

          this.puntos.set(data);

          this.cargando.set(false);

          this.pintarMarcadores(data);

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
          L.marker(
            [
              punto.latitud!,
              punto.longitud!
            ]
          )
            .addTo(this.mapa!)
            .bindPopup(
              this.crearPopup(punto)
            );


        marcador.bindTooltip(

          punto.codigo ||
          'Punto',

          {
            direction: 'top',

            offset: [
              0,
              -40
            ],

            opacity: 0.9
          }

        );


        marcador.on(
          'click',
          () => {

            this.resaltarPunto(
              punto
            );

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
          padding: [
            40,
            40
          ],

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

          <br><br>

          <strong>Descripción:</strong>
          ${this.escapeHtml(
            punto.descripcion || '-'
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
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );

  }


  // =====================================================
  // CENTRAR PUNTO
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
  // RESALTAR PUNTO
  // =====================================================

  private resaltarPunto(
    punto: PuntoTopografico
  ): void {

    this.localizarPunto(
      punto
    );

  }


  // =====================================================
  // NUEVO
  // =====================================================

  abrirNuevo(): void {

    if (!this.puedeCrearPuntoPorPlan()) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Límite del plan',

        detail:
          this.mensajeLimitePuntos()

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
        this.proyectoId,

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
      !this.modoEdicion() &&
      !this.puedeCrearPuntoPorPlan()
    ) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Límite del plan',

        detail:
          this.mensajeLimitePuntos()

      });

      return;

    }


    if (

      !this.puntoActual.codigo ||

      this.puntoActual.norte == null ||

      this.puntoActual.este == null ||

      this.puntoActual.elevacion == null

    ) {

      this.messageService.add({

        severity: 'warn',

        summary:
          'Datos incompletos',

        detail:
          'Código, norte, este y elevación son obligatorios.'

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

          summary:
            'Proceso exitoso',

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

            summary:
              'Eliminado',

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

            severity:
              'error',

            summary:
              'Error',

            detail:
              error?.error?.error ||
              'No fue posible eliminar el punto.'

          });

        }

      });

  }


  // =====================================================
  // IMPORTAR CSV
  // =====================================================

  async seleccionarArchivo(
    event: Event
  ): Promise<void> {

    const input =
      event.target as HTMLInputElement;


    const archivo =
      input.files?.[0];


    if (!archivo) {
      return;
    }


    if (
      !archivo.name
        .toLowerCase()
        .endsWith('.csv')
    ) {

      this.messageService.add({

        severity: 'warn',

        summary:
          'Archivo no válido',

        detail:
          'Selecciona un archivo CSV.'

      });


      input.value = '';

      return;

    }


    if (!this.puedeImportarCSV()) {

      this.messageService.add({

        severity: 'warn',

        summary: 'Límite del plan',

        detail:
          this.mensajeLimitePuntos()

      });

      input.value = '';

      return;

    }


    const limite =
      this.limitePuntos();

    const disponibles =
      this.puntosRestantes();


    if (
      limite !== null &&
      disponibles !== null
    ) {

      const cantidadCSV =
        await this.contarRegistrosCSV(
          archivo
        );


      if (
        cantidadCSV >
        disponibles
      ) {

        this.messageService.add({

          severity: 'warn',

          summary:
            'Límite del plan',

          detail:
            `El archivo contiene ${cantidadCSV} puntos y ` +
            `solo quedan ${disponibles} disponibles ` +
            `en este proyecto.`

        });


        input.value = '';

        return;

      }

    }


    this.importando.set(true);


    this.puntoService
      .importarCSV(

        this.proyectoId,

        archivo

      )
      .subscribe({

        next: (resultado) => {

          this.importando.set(false);


          this.messageService.add({

            severity: 'success',

            summary:
              'Importación exitosa',

            detail:
              resultado.mensaje

          });


          this.cargarPuntos();


          input.value = '';

        },


        error: (err) => {

          console.error(
            'Error importando CSV:',
            err
          );


          this.importando.set(false);


          this.messageService.add({

            severity:
              'error',

            summary:
              'Error al importar',

            detail:
              err?.error?.error ||

              'No se pudo importar el archivo.'

          });


          input.value = '';

        }

      });

  }


  // =====================================================
  // CONTAR REGISTROS CSV
  // =====================================================

  private async contarRegistrosCSV(
    archivo: File
  ): Promise<number> {

    const texto =
      await archivo.text();

    if (!texto.trim()) {
      return 0;
    }


    let registros = 0;

    let dentroDeComillas = false;


    for (
      let i = 0;
      i < texto.length;
      i++
    ) {

      const caracter =
        texto[i];


      if (
        caracter === '"'
      ) {

        if (
          dentroDeComillas &&
          texto[i + 1] === '"'
        ) {

          i++;

          continue;

        }

        dentroDeComillas =
          !dentroDeComillas;

        continue;

      }


      if (
        (caracter === '\n' ||
         caracter === '\r') &&
        !dentroDeComillas
      ) {

        if (
          caracter === '\r' &&
          texto[i + 1] === '\n'
        ) {

          i++;

        }

        registros++;

      }

    }


    const ultimaLineaTieneDatos =
      texto
        .trim()
        .length > 0;


    if (
      ultimaLineaTieneDatos &&
      !texto.endsWith('\n') &&
      !texto.endsWith('\r')
    ) {

      registros++;

    }


    /*
     * Los CSV de TopoPro utilizan una fila
     * de encabezados. La excluimos del total.
     */

    return Math.max(
      0,
      registros - 1
    );

  }


  // =====================================================
  // FORMULARIO VACÍO
  // =====================================================

  private formularioVacio():
    PuntoTopograficoRequest {

    return {

      proyectoId:
        this.proyectoId,

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
