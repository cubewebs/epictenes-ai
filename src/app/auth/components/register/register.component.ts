import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../interfaces/auth.interface';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  // styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  registrationSuccessMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {}

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Por favor, completa el formulario correctamente.';
      Object.values(this.registerForm.controls).forEach(control => {
        control.markAsDirty();
        control.markAsTouched();
      });
      if (this.registerForm.hasError('mismatch')) {
         this.errorMessage = 'Las contraseñas no coinciden.';
      }
      if (!this.registerForm.get('terms')?.value) {
        this.errorMessage = 'Debes aceptar los términos y condiciones.';
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.registrationSuccessMessage = null;

    const { email, password, firstName, lastName, terms } = this.registerForm.value;

    const additionalData: Partial<UserProfile> = {
      first_name: firstName,
      last_name: lastName,
      terms: terms,
    };

    try {
      const { error, user } = await this.authService.signUp({
        email,
        password_raw: password,
        data: additionalData
      });

      if (error) {
        this.errorMessage = error.message || 'Error en el registro.';
      } else {
        // Supabase puede requerir confirmación de email.
        // Si user.identities es null o vacío, usualmente significa que se envió confirmación.
        this.registrationSuccessMessage = '¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.';
        this.registerForm.reset();
        // Opcionalmente, redirigir a login o a una página de "verifica tu email"
        // setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      }
    } catch (e: any) {
      this.errorMessage = e.message || 'Ocurrió un error inesperado durante el registro.';
    } finally {
      this.isLoading = false;
    }
  }
}