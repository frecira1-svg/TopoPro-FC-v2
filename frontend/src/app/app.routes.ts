import { Routes } from '@angular/router';

import { Login } from './features/auth/pages/login/login';
import { InicioPublico } from './features/inicio-publico/pages/inicio-publico/inicio-publico';
import { CorreoVerificado } from './features/auth/pages/correo-verificado/correo-verificado';
import { Registro } from './features/auth/pages/registro/registro';

import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';
import { Proyectos } from './features/proyectos/pages/proyectos/proyectos';
import { Clientes } from './features/clientes/pages/clientes/clientes';
import { Perfil } from './features/perfil/pages/perfil/perfil';
import { PerfilPublico } from './features/perfil-publico/pages/perfil-publico/perfil-publico';
import { Directorio } from './features/directorio/pages/directorio/directorio';
import { Puntos } from './features/puntos/pages/puntos/puntos';
import { PuntosGeneral } from './features/puntos/pages/puntos-general/puntos-general';
import { Levantamientos } from './features/levantamientos/pages/levantamientos/levantamientos';
import { Mapas } from './features/mapas/pages/mapas/mapas';
import { Equipos } from './features/equipos/pages/equipos/equipos';
import { Publicaciones } from './features/publicaciones/pages/publicaciones/publicaciones';
import { Reportes } from './features/reportes/pages/reportes/reportes';
import { Configuracion } from './features/configuracion/pages/configuracion/configuracion';
import { BandejaContactos } from './features/contactos/pages/bandeja-contactos/bandeja-contactos';
import { Mensajeria } from './features/mensajeria/pages/mensajeria/mensajeria';

import { authGuard } from './core/guards/auth.guard';
import { permisoGuard } from './core/guards/permiso.guard';


export const routes: Routes = [

  // =====================================================
  // RUTA PRINCIPAL
  // =====================================================

  {
    path: '',
    component: InicioPublico,
    pathMatch: 'full'
  },


  // =====================================================
  // AUTENTICACIÓN
  // =====================================================

  {
    path: 'login',
    component: Login
  },

  {
    path: 'registro',
    component: Registro
  },

  {
    path: 'correo-verificado',
    component: CorreoVerificado
  },


  // =====================================================
  // DASHBOARD
  // =====================================================

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [
      authGuard
    ]
  },


  // =====================================================
  // PROYECTOS
  // =====================================================

  {
    path: 'proyectos',
    component: Proyectos,
    canActivate: [
      authGuard,
      permisoGuard('proyectosVer')
    ]
  },

  // =====================================================
// PUNTOS TOPOGRÁFICOS GENERALES
// =====================================================

{
  path: 'puntos',
  component: PuntosGeneral,
  canActivate: [
    authGuard,
    permisoGuard('proyectosVer')
  ]
},


  // =====================================================
  // PUNTOS DE UN PROYECTO
  // =====================================================

  {
    path: 'proyectos/:id/puntos',
    component: Puntos,
    canActivate: [
      authGuard,
      permisoGuard('proyectosVer')
    ]
  },


  // =====================================================
  // CLIENTES
  // =====================================================

  {
    path: 'clientes',
    component: Clientes,
    canActivate: [
      authGuard
    ]
  },


  // =====================================================
  // PERFIL
  // =====================================================

  {
    path: 'perfil',
    component: Perfil,
    canActivate: [
      authGuard
    ]
  },


  // =====================================================
  // PERFIL PROFESIONAL PÚBLICO
  // =====================================================

  {
    path: 'perfil-publico/:id',
    component: PerfilPublico
  },


  {
    path: 'directorio',
    component: Directorio
  },


  // =====================================================
  // LEVANTAMIENTOS
  // =====================================================

  {
    path: 'levantamientos',
    component: Levantamientos,
    canActivate: [
      authGuard,
      permisoGuard('levantamientosVer')
    ]
  },


  // =====================================================
  // EQUIPOS
  // =====================================================

  {
    path: 'equipos',
    component: Equipos,
    canActivate: [
      authGuard,
      permisoGuard('equiposVer')
    ]
  },


  // =====================================================
  // MAPAS
  // =====================================================

  {
    path: 'mapas',
    component: Mapas,
    canActivate: [
      authGuard
    ]
  },


  // =====================================================
  // PUBLICACIONES
  // =====================================================

  {
    path: 'publicaciones',
    component: Publicaciones
  },


  // =====================================================
  // REPORTES
  // =====================================================

  {
    path: 'reportes',
    component: Reportes,
    canActivate: [
      authGuard,
      permisoGuard('reportesVer')
    ]
  },


  // =====================================================
  // CONFIGURACIÓN
  // =====================================================

  {
    path: 'contactos',
    component: BandejaContactos,
    canActivate: [authGuard]
  },

  {
    path: 'mensajes',
    component: Mensajeria,
    canActivate: [authGuard]
  },

  {
    path: 'mensajes/:id',
    component: Mensajeria,
    canActivate: [authGuard]
  },


  {
    path: 'configuracion',
    component: Configuracion,
    canActivate: [
      authGuard
    ]
  },


  // =====================================================
  // RUTA NO ENCONTRADA
  // =====================================================

  {
    path: '**',
    redirectTo: 'login'
  }

];
