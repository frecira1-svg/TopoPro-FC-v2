import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  SuscripcionService,
  ContextoComercial,
  CrearSuscripcionResponse
} from '../../../../core/services/suscripcion.service';

import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-suscripcion',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './suscripcion.html',
  styleUrl: './suscripcion.css'
})
export class Suscripcion
  implements OnInit {

  private readonly suscripcionService =
    inject(SuscripcionService);

  private readonly cdr =
    inject(ChangeDetectorRef);


  // ==========================================================
  // PLAN
  // ==========================================================

  readonly codigoPlan =
    'PROFESSIONAL';

  readonly precio =
    39900;


  // ==========================================================
  // ESTADO
  // ==========================================================

  cargando =
    false;

  procesando =
    false;

  mensaje =
    '';

  error =
    '';

  contexto:
    ContextoComercial | null =
    null;


  // ==========================================================
  // INICIO
  // ==========================================================

  ngOnInit(): void {

    console.log(
      '=========================================='
    );

    console.log(
      'INICIANDO PÁGINA DE SUSCRIPCIÓN'
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
      'API URL:',
      environment.apiUrl
    );

    console.log(
      '=========================================='
    );


    this.cargarContextoComercial();

    this.procesarRetornoMercadoPago();

  }


  // ==========================================================
  // CONTEXTO COMERCIAL
  // ==========================================================

  private cargarContextoComercial(): void {

    this.cargando =
      true;

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


          this.contexto =
            contexto;

          this.cargando =
            false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'ERROR OBTENIENDO CONTEXTO COMERCIAL:',
            error
          );


          this.cargando =
            false;

          this.error =
            error?.error?.error ||
            'No fue posible consultar el estado de tu suscripción.';

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================================
  // SUSCRIPCIÓN ACTIVA
  // ==========================================================

  get tieneSuscripcionActiva(): boolean {

    return (
      this.contexto?.suscripcion?.estado ===
        'ACTIVA' &&
      this.contexto?.plan?.codigo ===
        this.codigoPlan
    );

  }


  // ==========================================================
  // CREAR SUSCRIPCIÓN
  // ==========================================================

  crearSuscripcion(): void {

    if (this.procesando) {

      return;

    }


    if (this.tieneSuscripcionActiva) {

      this.mensaje =
        'Ya tienes una suscripción activa para este plan.';

      this.cdr.detectChanges();

      return;

    }


    this.procesando =
      true;

    this.cargando =
      true;

    this.error =
      '';

    this.mensaje =
      'Preparando tu suscripción con Mercado Pago...';

    this.cdr.detectChanges();


    console.log(
      '=========================================='
    );

    console.log(
      'CREANDO CHECKOUT MERCADO PAGO'
    );

    console.log(
      'PLAN:',
      this.codigoPlan
    );

    console.log(
      '=========================================='
    );


    this.suscripcionService
      .crearSuscripcion({

        codigoPlan:
          this.codigoPlan

      })
      .subscribe({

        next: (
          respuesta: CrearSuscripcionResponse
        ) => {

          console.log(
            '=========================================='
          );

          console.log(
            'CHECKOUT MERCADO PAGO CREADO'
          );

          console.log(
            respuesta
          );

          console.log(
            '=========================================='
          );


          const initPoint =
            respuesta?.mercadoPago?.initPoint;


          // ==================================================
          // REDIRECCIÓN A MERCADO PAGO
          // ==================================================

          if (initPoint) {

            this.mensaje =
              'Redirigiendo a Mercado Pago para completar el pago...';

            this.cdr.detectChanges();


            window.location.href =
              initPoint;

            return;

          }


          // ==================================================
          // COMPATIBILIDAD CON RESPUESTA QUE YA TRAIGA ID
          // ==================================================

          const preapprovalId =
            respuesta?.mercadoPago?.preapprovalId ||
            respuesta?.proveedorSuscripcionId;


          if (preapprovalId) {

            this.mensaje =
              'Suscripción creada. Verificando estado...';

            this.cdr.detectChanges();


            this.confirmarSuscripcion(
              preapprovalId
            );

            return;

          }


          // ==================================================
          // NO SE OBTUVO CHECKOUT
          // ==================================================

          this.procesando =
            false;

          this.cargando =
            false;

          this.mensaje =
            '';

          this.error =
            'No fue posible obtener el enlace de pago de Mercado Pago.';

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            '=========================================='
          );

          console.error(
            'ERROR CREANDO CHECKOUT MERCADO PAGO'
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


          this.procesando =
            false;

          this.cargando =
            false;

          this.mensaje =
            '';

          this.error =
            error?.error?.error ||
            'No fue posible crear la suscripción.';

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================================
  // PROCESAR RETORNO DE MERCADO PAGO
  // ==========================================================

  private procesarRetornoMercadoPago(): void {

    try {

      const url =
        new URL(
          window.location.href
        );


      const preapprovalId =
        url.searchParams.get(
          'preapproval_id'
        );


      if (!preapprovalId) {

        return;

      }


      console.log(
        '=========================================='
      );

      console.log(
        'RETORNO DE MERCADO PAGO'
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

    }

  }


  // ==========================================================
  // CONFIRMAR SUSCRIPCIÓN
  // ==========================================================

  private confirmarSuscripcion(
    preapprovalId: string
  ): void {

    if (!preapprovalId) {

      this.error =
        'Mercado Pago no devolvió un identificador de suscripción válido.';

      this.procesando =
        false;

      this.cargando =
        false;

      this.cdr.detectChanges();

      return;

    }


    this.procesando =
      true;

    this.cargando =
      true;

    this.error =
      '';

    this.mensaje =
      'Verificando tu suscripción con Mercado Pago...';

    this.cdr.detectChanges();


    console.log(
      '=========================================='
    );

    console.log(
      'CONFIRMANDO SUSCRIPCIÓN'
    );

    console.log(
      'PREAPPROVAL ID:',
      preapprovalId
    );

    console.log(
      '=========================================='
    );


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


          this.procesando =
            false;

          this.cargando =
            false;

          this.error =
            '';

          this.mensaje =
            '¡Tu suscripción fue activada correctamente!';


          this.limpiarParametrosURL();

          this.cargarContextoComercial();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'ERROR CONFIRMANDO SUSCRIPCIÓN:',
            error
          );


          this.procesando =
            false;

          this.cargando =
            false;

          this.mensaje =
            '';

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


      [
        'preapproval_id',
        'status',
        'collection_status',
        'payment_id'
      ].forEach(
        (parametro) => {

          url.searchParams.delete(
            parametro
          );

        }
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

}
