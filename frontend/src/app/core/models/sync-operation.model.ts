import { PuntoTopograficoRequest } from './punto.model';

export type TipoOperacionSync =
  | 'CREAR_PUNTO'
  | 'ACTUALIZAR_PUNTO'
  | 'ELIMINAR_PUNTO';

export interface OperacionSync {
  /**
   * ID generado automáticamente por IndexedDB.
   */
  id?: number;

  /**
   * Tipo de operación pendiente.
   */
  tipo: TipoOperacionSync;

  /**
   * Entidad que se sincronizará.
   */
  entidad: 'PUNTO';

  /**
   * ID del punto.
   * No existe todavía cuando la operación es CREAR_PUNTO.
   */
  entidadId?: number;

  /**
   * Datos que serán enviados al backend.
   *
   * Para CREAR_PUNTO y ACTUALIZAR_PUNTO.
   */
  datos?: PuntoTopograficoRequest;

  /**
   * Fecha y hora en que se creó la operación offline.
   */
  fecha: string;
}
