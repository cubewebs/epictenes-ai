import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  // styleUrls: ['./login.component.css'] // Si necesitas estilos específicos
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {}

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor, completa el formulario correctamente.';
      Object.values(this.loginForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const { email, password } = this.loginForm.value;

    try {
      const { error } = await this.authService.signIn({ email, password });
      if (error) {
        this.errorMessage = error.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      } else {
        const returnUrl = this.router.routerState.snapshot.root.queryParams['returnUrl'] || '/home';
        this.router.navigateByUrl(returnUrl);
      }
    } catch (e: any) {
      this.errorMessage = e.message || 'Ocurrió un error inesperado.';
    } finally {
      this.isLoading = false;
    }
  }
}