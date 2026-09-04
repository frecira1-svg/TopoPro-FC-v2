import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  DashboardService,
  DashboardResumen
} from '../../services/dashboard.service';


interface UsuarioDashboard {

  nombre: string;
  apellido?: string;
  correo?: string;
  rol?: string;

}



@Component({

  selector: 'app-dashboard',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './dashboard.html',

  styleUrl: './dashboard.css'

})


export class Dashboard implements OnInit {


  usuario: UsuarioDashboard | null = null;



  resumen: DashboardResumen = {

    proyectos: 0,

    clientes: 0,

    puntos: 0,

    publicaciones: 0

  };



  cargando = true;



  constructor(

    private dashboardService: DashboardService,

    private router: Router

  ) {}




  ngOnInit(): void {


    this.cargarUsuario();


    this.obtenerResumen();


  }




  cargarUsuario(): void {


    const usuarioGuardado = localStorage.getItem('topopro_usuario');



    if (!usuarioGuardado) {

      return;

    }



    try {


      this.usuario = JSON.parse(usuarioGuardado);



    } catch (error) {


      console.error(
        'Error leyendo usuario guardado:',
        error
      );


      localStorage.removeItem('topopro_usuario');


    }


  }




  obtenerResumen(): void {


    this.cargando = true;



    this.dashboardService.obtenerResumen()
      .subscribe({



        next: (respuesta: DashboardResumen) => {



          this.resumen = {


            proyectos: respuesta.proyectos ?? 0,

            clientes: respuesta.clientes ?? 0,

            puntos: respuesta.puntos ?? 0,

            publicaciones: respuesta.publicaciones ?? 0


          };



          this.cargando = false;



        },



        error: (error) => {


          console.error(
            'Error cargando dashboard:',
            error
          );



          this.cargando = false;



        }



      });



  }





  irAProyectos(): void {

    this.router.navigate(['/proyectos']);

  }




  irAClientes(): void {

    this.router.navigate(['/clientes']);

  }




  irAPuntos(): void {

    this.router.navigate(['/proyectos']);

  }




  irAReportes(): void {

    console.log(
      'Módulo de reportes próximamente'
    );

  }




  cerrarSesion(): void {



    localStorage.removeItem('topopro_token');

    localStorage.removeItem('topopro_usuario');



    this.router.navigate(['/login']);



  }



}
