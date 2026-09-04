# Guía de Migración a Reactive Forms

## 📋 Descripción
Este documento proporciona ejemplos concretos de cómo migrar cada componente de Template-driven Forms a Reactive Forms con validaciones completas.

---

## 1. LOGIN - Migración Completa

### ❌ ACTUAL (Template-driven)
```typescript
// auth/pages/login/login.ts
export class Login {
  correo = '';
  password = '';
  cargando = signal(false);
  error = signal('');

  onSubmit(): void {
    if (!this.correo || !this.password) {
      this.error.set('Ingresa tu correo y contraseña');
      return;
    }
    // ...
  }
}
```

### ✅ NUEVO (Reactive Forms)
```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  formulario: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  cargando = signal(false);
  error = signal('');

  ngOnInit(): void {
    if (this.authService.estaAutenticado()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Verifica los datos ingresados');
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    const { correo, password } = this.formulario.value;
    this.authService.login({ correo, password }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err.error?.error || 'Error al iniciar sesión');
      }
    });
  }

  // Getters para template
  get correoControl() {
    return this.formulario.get('correo');
  }

  get passwordControl() {
    return this.formulario.get('password');
  }

  get passwordInvalido(): boolean {
    const control = this.passwordControl;
    return control ? control.invalid && control.touched : false;
  }

  get correoInvalido(): boolean {
    const control = this.correoControl;
    return control ? control.invalid && control.touched : false;
  }
}
```

### 📄 Template Login Actualizado
```html
<!-- auth/pages/login/login.html -->
<form [formGroup]="formulario" (ngSubmit)="onSubmit()" class="login-form">
  
  <!-- Error General -->
  <div *ngIf="error()" class="alert alert-danger">
    {{ error() }}
  </div>

  <!-- Campo Correo -->
  <div class="form-group">
    <label for="correo">Correo Electrónico</label>
    <input
      type="email"
      id="correo"
      formControlName="correo"
      class="form-control"
      [class.is-invalid]="correoInvalido"
      placeholder="tu@email.com"
    />
    <div class="invalid-feedback" *ngIf="correoInvalido">
      <span *ngIf="correoControl?.hasError('required')">El correo es requerido</span>
      <span *ngIf="correoControl?.hasError('email')">Ingresa un correo válido</span>
    </div>
  </div>

  <!-- Campo Contraseña -->
  <div class="form-group">
    <label for="password">Contraseña</label>
    <input
      type="password"
      id="password"
      formControlName="password"
      class="form-control"
      [class.is-invalid]="passwordInvalido"
      placeholder="Mínimo 6 caracteres"
    />
    <div class="invalid-feedback" *ngIf="passwordInvalido">
      <span *ngIf="passwordControl?.hasError('required')">La contraseña es requerida</span>
      <span *ngIf="passwordControl?.hasError('minlength')">Mínimo 6 caracteres</span>
    </div>
  </div>

  <!-- Botón Submit -->
  <button
    type="submit"
    class="btn btn-primary w-100"
    [disabled]="cargando() || formulario.invalid"
  >
    <span *ngIf="!cargando()">Iniciar Sesión</span>
    <span *ngIf="cargando()">
      <i class="pi pi-spin pi-spinner"></i> Ingresando...
    </span>
  </button>

  <!-- Link Registro -->
  <p class="mt-3 text-center">
    ¿No tienes cuenta? <a routerLink="/registro">Regístrate aquí</a>
  </p>
</form>
```

---

## 2. REGISTRO - Migración Completa

### ✅ NUEVO (Reactive Forms)
```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ReactiveFormsModule, 
  FormBuilder, 
  FormGroup, 
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  formulario: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required, 
      Validators.minLength(8),
      this.passwordFuerte()
    ]],
    confirmPassword: ['', Validators.required],
    aceptaTerminos: [false, Validators.requiredTrue]
  }, { validators: this.passwordsCoinciden() });

  cargando = signal(false);
  error = signal('');
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);

  ngOnInit(): void {
    if (this.authService.estaAutenticado()) {
      this.router.navigate(['/dashboard']);
    }
  }

  // Validador: Contraseña fuerte
  private passwordFuerte(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = control.value;
      if (!valor) return null;

      const criterios = {
        mayuscula: /[A-Z]/.test(valor),
        minuscula: /[a-z]/.test(valor),
        numero: /\d/.test(valor),
        especial: /[@$!%*?&]/.test(valor),
        longitud: valor.length >= 8
      };

      const esFuerte = Object.values(criterios).every(c => c);
      return esFuerte ? null : { passwordFuerte: criterios };
    };
  }

  // Validador: Las contraseñas coinciden
  private passwordsCoinciden(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password');
      const confirmPassword = group.get('confirmPassword');

      if (!password || !confirmPassword) return null;
      if (password.value === confirmPassword.value) return null;

      confirmPassword.setErrors({ 'passwordsMismatch': true });
      return { passwordsMismatch: true };
    };
  }

  onSubmit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Completa correctamente todos los campos');
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    const { nombre, apellido, correo, password } = this.formulario.value;
    
    this.authService.registrar({
      nombre,
      apellido,
      correo,
      password
    }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err.error?.error || 'Error al registrarse');
      }
    });
  }

  // Getters
  get nombreControl() {
    return this.formulario.get('nombre');
  }

  get apellidoControl() {
    return this.formulario.get('apellido');
  }

  get correoControl() {
    return this.formulario.get('correo');
  }

  get passwordControl() {
    return this.formulario.get('password');
  }

  get confirmPasswordControl() {
    return this.formulario.get('confirmPassword');
  }

  get aceptaTerminosControl() {
    return this.formulario.get('aceptaTerminos');
  }

  // Métodos auxiliares
  tieneError(campo: string, tipo: string): boolean {
    const control = this.formulario.get(campo);
    return control ? control.hasError(tipo) && control.touched : false;
  }

  passwordRequirementsText(): string {
    const pwd = this.passwordControl?.value || '';
    if (!pwd) return '';
    
    const reqs = {
      mayuscula: /[A-Z]/.test(pwd),
      minuscula: /[a-z]/.test(pwd),
      numero: /\d/.test(pwd),
      especial: /[@$!%*?&]/.test(pwd)
    };

    const textos = [];
    if (!reqs.mayuscula) textos.push('Una mayúscula');
    if (!reqs.minuscula) textos.push('Una minúscula');
    if (!reqs.numero) textos.push('Un número');
    if (!reqs.especial) textos.push('Un carácter especial (@$!%*?&)');

    return textos.length > 0 ? `Falta: ${textos.join(', ')}` : 'Contraseña fuerte ✓';
  }
}
```

---

## 3. PERFIL - Migración

### ✅ NUEVO (Reactive Forms)
```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';
import { Usuario } from '../../../../core/models/usuario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  usuario = signal<Usuario | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  subiendoFoto = signal(false);

  formulario: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    telefono: ['', [Validators.pattern(/^[\d\-\+\s\(\)]+$/), Validators.maxLength(20)]],
    profesion: ['', [Validators.maxLength(100)]],
    empresa: ['', [Validators.maxLength(100)]],
    ciudad: ['', [Validators.maxLength(100)]],
    pais: ['', [Validators.maxLength(100)]]
  });

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.cargando.set(true);
    this.authService.obtenerPerfil().subscribe({
      next: (respuesta) => {
        this.usuario.set(respuesta.usuario);
        this.formulario.patchValue({
          nombre: respuesta.usuario.nombre,
          apellido: respuesta.usuario.apellido,
          telefono: respuesta.usuario.telefono || '',
          profesion: respuesta.usuario.profesion || '',
          empresa: respuesta.usuario.empresa || '',
          ciudad: respuesta.usuario.ciudad || '',
          pais: respuesta.usuario.pais || ''
        });
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo cargar el perfil' 
        });
      }
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Datos incompletos', 
        detail: 'Verifica los campos obligatorios' 
      });
      return;
    }

    this.guardando.set(true);
    this.authService.actualizarPerfil(this.formulario.value).subscribe({
      next: (respuesta) => {
        this.usuario.set(respuesta.usuario);
        this.guardando.set(false);
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'Perfil actualizado correctamente' 
        });
      },
      error: () => {
        this.guardando.set(false);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo actualizar el perfil' 
        });
      }
    });
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    
    // Validar tipo de archivo
    if (!archivo.type.startsWith('image/')) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Archivo inválido', 
        detail: 'Solo se aceptan imágenes' 
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Archivo muy grande', 
        detail: 'Máximo 5MB' 
      });
      return;
    }

    this.subiendoFoto.set(true);
    this.authService.subirFoto(archivo).subscribe({
      next: (respuesta) => {
        this.usuario.set(respuesta.usuario);
        this.subiendoFoto.set(false);
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'Foto de perfil actualizada' 
        });
      },
      error: () => {
        this.subiendoFoto.set(false);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo subir la foto' 
        });
      }
    });
  }

  cancelar(): void {
    this.cargarPerfil();
  }

  // Getters para validación
  get nombreInvalido(): boolean {
    const control = this.formulario.get('nombre');
    return control ? control.invalid && control.touched : false;
  }

  get apellidoInvalido(): boolean {
    const control = this.formulario.get('apellido');
    return control ? control.invalid && control.touched : false;
  }

  tieneError(campo: string, tipo: string): boolean {
    const control = this.formulario.get(campo);
    return control ? control.hasError(tipo) && control.touched : false;
  }
}
```

---

## 4. PROYECTOS - Migración

### ✅ NUEVO (Reactive Forms)
```typescript
// Extracto clave - Formulario
formulario: FormGroup = this.fb.group({
  nombre: ['', [
    Validators.required, 
    Validators.minLength(3), 
    Validators.maxLength(100)
  ]],
  descripcion: ['', [Validators.maxLength(500)]],
  cliente: ['', Validators.required],
  ubicacion: ['', Validators.required],
  estado: ['EN_PROGRESO', Validators.required]
});

// En guardar()
guardar(): void {
  if (this.formulario.invalid) {
    this.formulario.markAllAsTouched();
    this.messageService.add({ 
      severity: 'warn', 
      summary: 'Faltan datos', 
      detail: 'Completa los campos obligatorios' 
    });
    return;
  }

  const datos = this.formulario.value;
  // ... resto del código
}
```

---

## 5. PUNTOS - Migración

### ✅ NUEVO (Reactive Forms - Extracto)
```typescript
formulario: FormGroup = this.fb.group({
  proyectoId: [this.proyectoId, Validators.required],
  codigo: ['', [
    Validators.required,
    Validators.pattern(/^[A-Z0-9\-]+$/) // Solo mayúsculas, números y guiones
  ]],
  norte: [0, [Validators.required, Validators.min(0)]],
  este: [0, [Validators.required, Validators.min(0)]],
  elevacion: [0, Validators.required],
  descripcion: ['', Validators.maxLength(500)],
  tipo: ['', Validators.required],
  precision: [null],
  equipo: [''],
  metodo: [''],
  observaciones: [''],
  latitud: [null],
  longitud: [null]
});

guardar(): void {
  if (this.formulario.invalid) {
    this.formulario.markAllAsTouched();
    this.messageService.add({
      severity: 'warn',
      summary: 'Datos incompletos',
      detail: 'Verifica código, norte, este, elevación y tipo'
    });
    return;
  }

  const datos = this.formulario.value;
  // ... resto
}
```

---

## 📋 Checklist de Migración

```
Para cada componente migrar:

[ ] 1. Importar ReactiveFormsModule
[ ] 2. Crear FormGroup con FormBuilder
[ ] 3. Agregar Validators (required, email, minLength, etc)
[ ] 4. Crear getters para template
[ ] 5. Actualizar template (formGroup, formControlName)
[ ] 6. Mostrar errores dinámicos
[ ] 7. Deshabilitar botón submit si inválido
[ ] 8. Remover validación manual
[ ] 9. Testear funcionamiento
[ ] 10. Validar mensajes de error
```

---

## 🎯 Validadores Comunes a Usar

```typescript
// Importar
import { Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

// Básicos
Validators.required
Validators.email
Validators.minLength(n)
Validators.maxLength(n)
Validators.min(n)
Validators.max(n)
Validators.pattern(/regex/)
Validators.requiredTrue // Para checkboxes

// Personalizados
passwordFuerte(): ValidatorFn { ... }
passwordsCoinciden(): ValidatorFn { ... }
codigoUnico(): ValidatorFn { ... }
```

---

**Nota**: Los ejemplos usan Angular 19 con `FormBuilder` y `Validators` de `@angular/forms`.
