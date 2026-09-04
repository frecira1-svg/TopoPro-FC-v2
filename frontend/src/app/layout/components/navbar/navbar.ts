import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {

  usuario: any = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const usuarioGuardado = localStorage.getItem('topopro_usuario');

    if (usuarioGuardado) {
      this.usuario = JSON.parse(usuarioGuardado);
    }
  }

  cerrarSesion(): void {
    localStorage.removeItem('topopro_token');
    localStorage.removeItem('topopro_usuario');

    this.router.navigate(['/login']);
  }

}
