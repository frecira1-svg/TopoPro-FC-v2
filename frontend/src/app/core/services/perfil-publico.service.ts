import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PerfilPublico } from '../models/perfil-publico.model';

@Injectable({ providedIn: 'root' })
export class PerfilPublicoService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/perfiles-publicos`;

  obtenerPerfil(id: number): Observable<PerfilPublico> {
    return this.http.get<PerfilPublico>(`${this.API_URL}/${id}`);
  }
}
