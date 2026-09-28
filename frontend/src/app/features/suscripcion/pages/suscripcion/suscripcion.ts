import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  SuscripcionService,
  ContextoComercial
} from '../../../../core/services/suscripcion.service';


@Component({
  selector: 'app-suscripcion',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './suscripcion.html',
  styleUrl: './suscripcion.css'
})
export class Suscripcion implements OnInit {

  private readonly suscripcionService =
    inject(SuscripcionService);

  private readonly cdr =
    inject(ChangeDetectorRef);


  // ==========================================================
  // PLAN
  // ==========================================================

  readonly codigoPlan = 'PROFESSIONAL';

  readonly precio = 39900;


  // ==========================================================
  // ESTADO
  // ==========================================================

  cargando = false;

  procesando = false;

  mensaje = '';

  error = '';

  contexto: ContextoComercial | null = null;


  // ==========================================================
  // INICIO
  // ==========================================================

  ngOnInit(): void {

    this.cargarContextoComercial();

    this.procesarRetornoMercadoPago();

  }


  // ==========================================================
  // OBTENER CONTEXTO COMERCIAL
  // ==========================================================

  private cargarContextoComercial(): void {

    this.cargando = true;

    this.suscripcionService
      .obtenerContextoComercial()
      .subscribe({

        next: (contexto) => {

          console.log(
            '========== CONTEXTO COMERCIAL =========='
          );

          console.log(
            contexto
          );

          console.log(
            '========================================'
          );


          this.contexto = contexto;

          this.cargando = false;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'ERROR OBTENIENDO CONTEXTO COMERCIAL:',
            error
          );

          this.cargando = false;

          this.error =
            error?.error?.error ||
            'No fue posible consultar el estado de tu suscripción.';

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================================
  // VERIFICAR SI TIENE SUSCRIPCIÓN ACTIVA
  // ==========================================================

  get tieneSuscripcionActiva(): boolean {

    return (
      this.contexto?.suscripcion?.estado === 'ACTIVA' &&
      this.contexto?.plan?.codigo === this.codigoPlan
    );

  }


  // ==========================================================
  // PROCESAR RETORNO DE MERCADO PAGO
  // ==========================================================

  private procesarRetornoMercadoPago(): void {

    try {

      const params =
        new URLSearchParams(
          window.location.search
        );


      const preapprovalId =
        params.get('preapproval_id');


      if (!preapprovalId) {

        return;

      }


      console.log(
        '=========================================='
      );

      console.log(
        'RETORNO MERCADO PAGO'
      );

      console.log(
        'PREAPPROVAL ID:',
        preapprovalId
      );

      console.log(
        '=========================================='
      );


      this.confirmarSuscripcion(
        preapprovalId
      );

    } catch (error) {

      console.error(
        'ERROR PROCESANDO RETORNO MERCADO PAGO:',
        error
      );

      this.error =
        'No fue posible procesar la respuesta de Mercado Pago.';

      this.cdr.detectChanges();

    }

  }


  // ==========================================================
  // CONFIRMAR SUSCRIPCIÓN
  // ==========================================================

  private confirmarSuscripcion(
    preapprovalId: string
  ): void {

    this.procesando = true;

    this.cargando = true;

    this.error = '';

    this.mensaje =
      'Verificando tu suscripción con Mercado Pago...';

    this.cdr.detectChanges();


    this.suscripcionService
      .confirmarSuscripcion({
        preapprovalId
      })
      .subscribe({

        next: (respuesta) => {

          console.log(
            '=========================================='
          );

          console.log(
            'SUSCRIPCIÓN CONFIRMADA'
          );

          console.log(
            respuesta
          );

          console.log(
            '=========================================='
          );


          this.procesando = false;

          this.cargando = false;

          this.error = '';

          this.mensaje =
            '¡Tu suscripción fue activada correctamente!';


          // Volvemos a consultar el contexto para que
          // la pantalla refleje inmediatamente el nuevo plan.
          this.cargarContextoComercial();


          this.cdr.detectChanges();


          this.limpiarParametrosURL();

        },

        error: (error) => {

          console.error(
            '=========================================='
          );

          console.error(
            'ERROR CONFIRMANDO SUSCRIPCIÓN'
          );

          console.error(
            'STATUS:',
            error?.status
          );

          console.error(
            'BODY:',
            error?.error
          );

          console.error(
            '=========================================='
          );


          this.procesando = false;

          this.cargando = false;

          this.mensaje = '';

          this.error =
            error?.error?.error ||
            'No fue posible confirmar la suscripción.';

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================================
  // LIMPIAR URL
  // ==========================================================

  private limpiarParametrosURL(): void {

    try {

      const url =
        new URL(
          window.location.href
        );


      url.searchParams.delete(
        'preapproval_id'
      );

      url.searchParams.delete(
        'status'
      );

      url.searchParams.delete(
        'collection_status'
      );

      url.searchParams.delete(
        'payment_id'
      );


      window.history.replaceState(
        {},
        document.title,
        url.pathname +
        (
          url.search
            ? url.search
            : ''
        )
      );

    } catch (error) {

      console.warn(
        'No fue posible limpiar la URL:',
        error
      );

    }

  }


  // ==========================================================
  // CONTRATAR PLAN
  // ==========================================================

  contratarPlan(): void {

    if (this.procesando) {

      return;

    }


    if (this.tieneSuscripcionActiva) {

      this.mensaje =
        'Ya tienes una suscripción Profesional activa.';

      return;

    }


    this.error = '';

    this.mensaje = '';

    this.procesando = true;

    this.cargando = true;

    this.mensaje =
      'Preparando el pago seguro con Mercado Pago...';

    this.cdr.detectChanges();


    console.log(
      '=========================================='
    );

    console.log(
      'INICIANDO CHECKOUT MERCADO PAGO'
    );

    console.log(
      'PLAN:',
      this.codigoPlan
    );

    console.log(
      'PRECIO:',
      this.precio
    );

    console.log(
      '=========================================='
    );


    this.suscripcionService
      .crearSuscripcion({
        codigoPlan: this.codigoPlan
      })
      .subscribe({

        next: (respuesta) => {

          console.log(
            'CHECKOUT MERCADO PAGO:',
            respuesta
          );


          const initPoint =
            respuesta?.mercadoPago?.initPoint;


          if (!initPoint) {

            console.error(
              'Mercado Pago no devolvió initPoint.'
            );


            this.procesando = false;

            this.cargando = false;

            this.mensaje = '';

            this.error =
              'No fue posible obtener el enlace de pago de Mercado Pago.';

            this.cdr.detectChanges();

            return;

          }


          console.log(
            'REDIRIGIENDO A:',
            initPoint
          );


          window.location.href =
            initPoint;

        },

        error: (error) => {

          console.error(
            '=========================================='
          );

          console.error(
            'ERROR CREANDO CHECKOUT'
          );

          console.error(
            'STATUS:',
            error?.status
          );

          console.error(
            'BODY:',
            error?.error
          );

          console.error(
            '=========================================='
          );


          this.procesando = false;

          this.cargando = false;

          this.mensaje = '';

          this.error =
            error?.error?.error ||
            'No fue posible iniciar el proceso de suscripción.';

          this.cdr.detectChanges();

        }

      });

  }

}
