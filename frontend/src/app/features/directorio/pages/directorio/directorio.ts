import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DirectorioService } from '../../../../core/services/directorio.service';
import { ProfesionalDirectorio } from '../../../../core/models/profesional-directorio.model';

@Component({
  selector: 'app-directorio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './directorio.html',
  styleUrl: './directorio.css'
})
export class Directorio implements OnInit {
  private readonly service = inject(DirectorioService);
  profesionales = signal<ProfesionalDirectorio[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = '';
  ciudad = '';
  especialidad = '';

  ngOnInit(): void { this.buscar(); }

  buscar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.service.listar({ busqueda: this.busqueda, ciudad: this.ciudad, especialidad: this.especialidad }).subscribe({
      next: data => { this.profesionales.set(data); this.cargando.set(false); },
      error: () => { this.error.set('No pudimos cargar el directorio.'); this.cargando.set(false); }
    });
  }

  limpiar(): void {
    this.busqueda = this.ciudad = this.especialidad = '';
    this.buscar();
  }

  nombre(p: ProfesionalDirectorio): string { return `${p.nombre} ${p.apellido}`.trim(); }
  iniciales(p: ProfesionalDirectorio): string { return `${p.nombre?.[0] ?? ''}${p.apellido?.[0] ?? ''}`.toUpperCase(); }
}
