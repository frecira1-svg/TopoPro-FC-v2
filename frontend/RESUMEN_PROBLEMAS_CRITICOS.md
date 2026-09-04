# 🚨 Problemas Críticos - TopoPro FC Frontend

## 1️⃣ AUTH INTERCEPTOR - BLOQUEANTE
**Archivo**: `src/app/core/interceptors/auth.interceptor.ts:11`

```typescript
❌ INCORRECTO (Actual)
const reqClonado = req.clone({
  setHeaders: {
    Authorization: `****** ← FALTA EL TOKEN
  }
});

✅ CORRECTO
const reqClonado = req.clone({
  setHeaders: {
    Authorization: `Bearer ${token}`
  }
});
```

**Impacto**: 🔴 CRÍTICO
- Todas las peticiones autenticadas fallan (401)
- Backend rechaza todas las requests
- Usuario no puede hacer ninguna operación

**Fix rapido**: 2 minutos

---

## 2️⃣ FORMULARIOS SIN VALIDACIÓN REACTIVA
**Componentes Afectados**: 6/11

| Componente | Estado | Líneas |
|-----------|--------|-------|
| Login | ❌ Sin validación | 25 |
| Registro | ❌ Sin validación | 30 |
| Perfil | ❌ Sin validación | 45 |
| Proyectos | ❌ Sin validación | 50 |
| Publicaciones | ❌ Sin validación | 65 |
| Puntos | ❌ Sin validación | 60 |
| Clientes | ✅ Reactive Forms | - |
| Equipos | ✅ Reactive Forms | - |
| Levantamientos | ✅ Reactive Forms | - |

**Problema**:
```typescript
// Validación manual = frágil
if (!this.correo || !this.password) {
  this.error.set('Faltan datos');
  return;
}
```

**Impacto**: 🟠 ALTO
- Validación incompleta en cliente
- Mensajes de error genéricos
- Difícil de mantener
- Falta feedback visual en campos

**Esfuerzo**: ~20 horas (3-4 componentes/hora)

---

## 3️⃣ VISTA CONFIGURACIÓN - NO EXISTE
**Ruta**: `/configuracion`
**Archivo**: `src/app/features/configuracion/pages/configuracion/`

```typescript
@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class Configuracion {
  // 🚫 VACÍO - Sin funcionalidad
}
```

**Impacto**: 🟡 MEDIO
- Ruta aparece en navbar pero no funciona
- Sin gestión de preferencias
- Sin cambio de contraseña

---

## 4️⃣ DASHBOARD - INCONSISTENCIA DE DATOS
**Archivo**: `src/app/features/dashboard/pages/dashboard/dashboard.ts:92`

```typescript
❌ PROBLEMA
cargarUsuario(): void {
  const usuarioGuardado = localStorage.getItem('topopro_usuario');
  // Lee directamente del localStorage, no del servicio
}

✅ SOLUCIÓN
cargarUsuario(): void {
  this.usuario = this.authService.usuarioActual();
  // Usa el signal reactivo del servicio
}
```

**Impacto**: 🟡 MEDIO
- Usuario puede quedar desincronizado
- Cambios en perfil no se reflejan
- Múltiples fuentes de verdad

---

## 5️⃣ SIN CACHE EN SERVICIOS
**Todos los servicios** no usan `shareReplay`

```typescript
❌ ACTUAL
obtenerTodos(): Observable<Proyecto[]> {
  return this.http.get<Proyecto[]>(this.API_URL);
}
// Cada click = nueva petición HTTP

✅ DEBERÍA SER
private proyectos$ = this.http.get<Proyecto[]>(this.API_URL).pipe(
  shareReplay(1)
);

obtenerTodos(): Observable<Proyecto[]> {
  return this.proyectos$;
}
```

**Impacto**: 🟡 MEDIO
- Peticiones innecesarias
- Rendimiento degradado
- Carga mayor en backend

---

## 6️⃣ ERROR INTERCEPTOR INCOMPLETO
**Archivo**: `src/app/core/interceptors/error.interceptor.ts`

```typescript
✅ IMPLEMENTADO
- 401 (Unauthorized) → logout + redirect

❌ FALTA
- 403 (Forbidden) → mensaje "Acceso denegado"
- 404 (Not Found) → mensaje "Recurso no encontrado"
- 500 (Server Error) → mensaje "Error del servidor"
- Timeout → reintentos automáticos
- Network error → modo offline
```

**Impacto**: 🟡 MEDIO
- Errores confusos para usuario
- Sin reintentos automáticos
- Sin manejo de conexión perdida

---

## PRIORIDAD DE FIXES

### P0 - Hoy (Bloqueantes)
```
1. ✅ Auth Interceptor - Agregar token
   Tiempo: 5 min
   Criticidad: 🔴 Bloqueante

2. ✅ Revisar que interceptor esté siendo usado
   Tiempo: 10 min
```

### P1 - Esta semana
```
3. Reactive Forms en Login/Registro/Perfil
   Tiempo: 6 horas
   Criticidad: 🟠 Alto

4. Implementar Configuración
   Tiempo: 3 horas
   Criticidad: 🟡 Medio

5. Cache con shareReplay en servicios
   Tiempo: 2 horas
   Criticidad: 🟡 Medio
```

### P2 - Próximas dos semanas
```
6. Error Interceptor mejorado
   Tiempo: 3 horas
   Criticidad: 🟡 Medio

7. Reactive Forms en Proyectos/Publicaciones/Puntos
   Tiempo: 9 horas
   Criticidad: 🟠 Alto

8. Dashboard mejorado
   Tiempo: 4 horas
   Criticidad: 🟡 Medio
```

---

## CHECKLIST RÁPIDO

```
[ ] 1. Corregir auth.interceptor.ts (Bearer token)
[ ] 2. Verificar que interceptor está registrado en app.config
[ ] 3. Migrar Login a Reactive Forms
[ ] 4. Migrar Registro a Reactive Forms  
[ ] 5. Migrar Perfil a Reactive Forms
[ ] 6. Crear vista Configuracion
[ ] 7. Agregar shareReplay(1) en servicios
[ ] 8. Extender error.interceptor con más códigos HTTP
[ ] 9. Migrar Proyectos a Reactive Forms
[ ] 10. Migrar Publicaciones a Reactive Forms
[ ] 11. Migrar Puntos a Reactive Forms
[ ] 12. Mejorar Dashboard con AuthService
```

---

## 📞 Contacto Rápido

**Para implementar los fixes, ver**:
- `ANALISIS_ARQUITECTURA.md` → Análisis completo
- `MIGRACIONES_REACTIVE_FORMS.md` → Código de ejemplo

**Documentos generados**: 2026-08-20
**Estado**: 65% completitud
