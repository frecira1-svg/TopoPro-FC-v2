import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, catchError, of, Subscription, switchMap, timer } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioChat { id:number; nombre:string; apellido:string; foto?:string|null; profesion?:string|null; }
export interface MensajeInterno { id:number; contenido:string; leido:boolean; createdAt:string; remitenteId:number; conversacionId:number; }
export interface ConversacionResumen { id:number; updatedAt:string; otro:UsuarioChat; ultimo:MensajeInterno|null; noLeidos:number; }
export interface ConversacionDetalle { conversacion:{id:number;otro:UsuarioChat}; mensajes:MensajeInterno[]; }

@Injectable({providedIn:'root'})
export class MensajeriaService {
  private readonly http=inject(HttpClient);
  private readonly api=`${environment.apiUrl}/mensajes`;
  private readonly noLeidosSubject=new BehaviorSubject<number>(0);
  readonly noLeidos$=this.noLeidosSubject.asObservable();
  private polling?:Subscription;
  private ultimoNoLeidos: number | null = null;
  private readonly actualizacionSubject = new Subject<void>();
  readonly actualizacion$ = this.actualizacionSubject.asObservable();

  listar():Observable<ConversacionResumen[]>{return this.http.get<ConversacionResumen[]>(this.api);}
  obtener(id:number):Observable<ConversacionDetalle>{return this.http.get<ConversacionDetalle>(`${this.api}/${id}`);}
  enviar(destinatarioId:number,contenido:string):Observable<MensajeInterno>{return this.http.post<MensajeInterno>(this.api,{destinatarioId,contenido});}
  noLeidos():Observable<{noLeidos:number}>{return this.http.get<{noLeidos:number}>(`${this.api}/no-leidos`);}
  actualizarNoLeidos():void{
    if(!localStorage.getItem('topopro_token')){this.ultimoNoLeidos=0;this.noLeidosSubject.next(0);return;}
    this.noLeidos().pipe(catchError(()=>of({noLeidos:0}))).subscribe(r=>this.procesarNoLeidos(r.noLeidos));
  }

  iniciarNotificaciones():void{
    if(this.polling)return;
    this.actualizarNoLeidos();
    this.polling=timer(10000,10000).pipe(
      switchMap(()=>this.noLeidos().pipe(catchError(()=>of({noLeidos:0}))))
    ).subscribe(r=>this.procesarNoLeidos(r.noLeidos));
  }

  private procesarNoLeidos(total:number):void{
    const anterior=this.ultimoNoLeidos;
    this.ultimoNoLeidos=total;
    this.noLeidosSubject.next(total);
    if(anterior !== null && total > anterior){
      this.actualizacionSubject.next();
      this.mostrarNotificacionNavegador(total-anterior);
    }
  }

  async habilitarNotificacionesNavegador():Promise<NotificationPermission | 'unsupported'>{
    if(typeof Notification === 'undefined') return 'unsupported';
    if(Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  }

  private mostrarNotificacionNavegador(cantidad:number):void{
    if(typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const texto=cantidad===1 ? 'Tienes un mensaje nuevo en TopoPro.' : `Tienes ${cantidad} mensajes nuevos en TopoPro.`;
    new Notification('💬 Nuevo mensaje — TopoPro', { body:texto, tag:'topopro-mensajes' });
  }

  detenerNotificaciones():void{this.polling?.unsubscribe();this.polling=undefined;}
  marcarLeidos(id:number):Observable<{ok:boolean}>{return this.http.patch<{ok:boolean}>(`${this.api}/${id}/leer`,{});}
}
