import {
  Component,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup
} from '@angular/forms';

import {
  Router,
  RouterLink,
  ActivatedRoute
} from '@angular/router';

import {
  AuthService
} from '../../../../core/services/auth.service';


@Component({
  selector: 'app-login',

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl: './login.html',

  styleUrl: './login.css',
})
export class Login {

  form: FormGroup;

  cargando =
    signal(false);

  error =
    signal('');


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(

    private fb: FormBuilder,

    private authService: AuthService,

    private router: Router,

    private route: ActivatedRoute

  ) {

    this.form =
      this.fb.group({

        correo: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ],

        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6)
          ]
        ]

      });

  }


  // ==========================================================
  // INICIAR SESIÓN
  // ==========================================================

  onSubmit(): void {

    if (this.form.invalid) {

      this.error.set(
        'Completa los campos correctamente'
      );

      this.form.markAllAsTouched();

      return;

    }


    const {
      correo,
      password
    } =
      this.form.value;


    this.cargando.set(true);

    this.error.set('');


    this.authService
      .login({
        correo,
        password
      })
      .subscribe({

        // ====================================================
        // LOGIN CORRECTO
        // ====================================================

        next: () => {

          this.cargando.set(false);


          // --------------------------------------------------
          // Recuperar la ruta solicitada originalmente
          // --------------------------------------------------

          const returnUrl =
            this.route.snapshot.queryParamMap.get(
              'returnUrl'
            );


          // --------------------------------------------------
          // Seguridad:
          // solo permitimos rutas internas de TopoPro.
          // --------------------------------------------------

          if (
            returnUrl &&
            returnUrl.startsWith('/')
          ) {

            console.log(
              'Redirigiendo a la ruta solicitada:',
              returnUrl
            );


            this.router.navigateByUrl(
              returnUrl
            );

            return;

          }


          // --------------------------------------------------
          // Comportamiento normal
          // --------------------------------------------------

          this.router.navigate([
            '/dashboard'
          ]);

        },


        // ====================================================
        // ERROR LOGIN
        // ====================================================

        error: (err) => {

          this.cargando.set(false);

          this.error.set(
            err?.error?.error ||
            'Error al iniciar sesión'
          );

        }

      });

  }

}
