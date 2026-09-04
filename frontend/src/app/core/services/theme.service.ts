import { Injectable, signal, effect } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly STORAGE_KEY = 'topopro_tema';

  tema = signal<Tema>(this.obtenerTemaGuardado());

  constructor() {
    effect(() => {
      const temaActual = this.tema();
      document.documentElement.setAttribute('data-tema', temaActual);
      localStorage.setItem(this.STORAGE_KEY, temaActual);
    });
  }

  alternarTema(): void {
    this.tema.set(this.tema() === 'claro' ? 'oscuro' : 'claro');
  }

  establecerTema(tema: Tema): void {
    this.tema.set(tema);
  }

  private obtenerTemaGuardado(): Tema {
    const guardado = localStorage.getItem(this.STORAGE_KEY);
    return guardado === 'oscuro' ? 'oscuro' : 'claro';
  }

}
