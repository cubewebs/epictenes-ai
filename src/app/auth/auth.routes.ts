import { Routes } from '@angular/router';

// Asumiremos que tendrás componentes LoginComponent y RegisterComponent
// import { LoginComponent } from './components/login/login.component';
// import { RegisterComponent } from './components/register/register.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    // component: LoginComponent  // Descomentar cuando el componente exista
    // Carga diferida de componente standalone (ejemplo)
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    // component: RegisterComponent // Descomentar cuando el componente exista
    // Carga diferida de componente standalone (ejemplo)
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  // Podrías añadir aquí rutas para 'forgot-password', 'reset-password', etc.
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
