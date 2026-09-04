import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, switchMap, catchError, of, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactoRequest { asunto?: string; mensaje: string; }
export interface ContactoRespuesta { mensaje: string; contactoId: number; notificado: boolean; }
export interface ContactoProfesional { id:number; asunto:string|null; mensaje:string; nombreContacto:string; correoContacto:string; estado:'PENDIENTE'|'LEIDO'|'RESPONDIDO'; createdAt:string; remitenteId:number; }

@Injectable({ providedIn: 'root' })
export class ContactoProfesionalService {
  private readonly pendientesSubject = new BehaviorSubject<number>(0);
  readonly pendientes$ = this.pendientesSubject.asObservable();
  private polling?: Subscription;
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/contactos-profesionales`;

  recibidos(): Observable<ContactoProfesional[]> { return this.http.get<ContactoProfesional[]>(`${this.api}/recibidos`); }

  pendientes(): Observable<{ pendientes:number }> { return this.http.get<{ pendientes:number }>(`${this.api}/pendientes`); }

  actualizarPendientes(): void {
    if (!localStorage.getItem('topopro_token')) {
      this.pendientesSubject.next(0);
      return;
    }
    this.pendientes().pipe(catchError(() => of({ pendientes: 0 }))).subscribe(r => this.pendientesSubject.next(r.pendientes));
  }

  iniciarNotificaciones(): void {
    if (this.polling) return;
    this.actualizarPendientes();
    this.polling = timer(60000, 60000).pipe(
      switchMap(() => this.pendientes().pipe(catchError(() => of({ pendientes: 0 }))))
    ).subscribe(r => this.pendientesSubject.next(r.pendientes));
  }

  detenerNotificaciones(): void {
    this.polling?.unsubscribe();
    this.polling = undefined;
  }

  cambiarEstado(id:number, estado:'PENDIENTE'|'LEIDO'|'RESPONDIDO'): Observable<{id:number;estado:string}> { return this.http.patch<{id:number;estado:string}>(`${this.api}/${id}/estado`, {estado}); }

  enviar(usuarioId: number, datos: ContactoRequest): Observable<ContactoRespuesta> {
    return this.http.post<ContactoRespuesta>(`${this.api}/${usuarioId}`, datos);
  }
}
