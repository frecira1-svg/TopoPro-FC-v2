import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

@Component({
  selector: 'app-inicio-publico',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio-publico.html',
  styleUrl: './inicio-publico.css'
})
export class InicioPublico {

  private readonly router = inject(Router);

  deferredPrompt: BeforeInstallPromptEvent | null = null;
  mostrarInstalar = false;

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event): void {
    event.preventDefault();

    this.deferredPrompt = event as BeforeInstallPromptEvent;
    this.mostrarInstalar = true;

    console.log('TopoPro: aplicación disponible para instalación.');
  }

  @HostListener('window:appinstalled')
  onAppInstalled(): void {
    this.deferredPrompt = null;
    this.mostrarInstalar = false;

    console.log('TopoPro: aplicación instalada correctamente.');
  }

  async instalarTopoPro(): Promise<void> {
    if (!this.deferredPrompt) {
      return;
    }

    await this.deferredPrompt.prompt();

    const { outcome } =
      await this.deferredPrompt.userChoice;

    console.log(
      `TopoPro: instalación ${
        outcome === 'accepted'
          ? 'aceptada'
          : 'cancelada'
      }.`
    );

    this.deferredPrompt = null;
    this.mostrarInstalar = false;
  }

  // ==========================================
  // CONTRATAR PLAN PROFESIONAL
  // ==========================================

  contratarProfesional(): void {

    this.router.navigate(['/suscripcion']);

  }

}
