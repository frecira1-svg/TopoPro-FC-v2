import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardResumen {
  proyectos: number;
  clientes: number;
  puntos: number;
  publicaciones: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private http = inject(HttpClient);

  private api = `${environment.apiUrl}/dashboard`;

  obtenerResumen(): Observable<DashboardResumen> {

    return this.http.get<DashboardResumen>(
      `${this.api}/resumen?_=${Date.now()}`
    );

  }

}
