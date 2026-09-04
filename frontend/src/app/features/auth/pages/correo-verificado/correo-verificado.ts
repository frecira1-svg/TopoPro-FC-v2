import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-correo-verificado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './correo-verificado.html',
  styleUrl: './correo-verificado.css'
})
export class CorreoVerificado implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  exito = signal(false);
  mensaje = signal('');

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const estado = params['estado'];
      this.exito.set(estado === 'exito');
      this.mensaje.set(
        params['mensaje'] || (this.exito() ? 'Tu correo fue verificado correctamente.' : 'No se pudo verificar el correo.')
      );
    });
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }
}
