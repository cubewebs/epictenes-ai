import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard'; // Asegúrate que la ruta sea correcta
import { VoiceChatComponent } from './views/voice-chat/voice-chat.component'; // Added import

export const APP_ROUTES: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
    // Si tienes un AuthLayoutComponent:
    // component: AuthLayoutComponent,
    // children: [
    //   { path: '', loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES) }
    // ]
  },
  {
    path: 'home',
    loadComponent: () => import('./views/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'session', // Added new route for voice chat
    component: VoiceChatComponent, // Use component directly as VoiceChatComponent is standalone
    canActivate: [AuthGuard]
  },
  // Ruta raíz redirige a home si está autenticado, si no, el guard redirigirá a login
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  // Otras rutas protegidas irían aquí, dentro de un path con canActivate o individualmente
  // {
  //   path: 'profile',
  //   loadComponent: () => import('./views/profile/profile.component').then(m => m.ProfileComponent),
  //   canActivate: [AuthGuard]
  // },
  {
    path: 'profile',
    loadComponent: () => import('./views/profile/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./views/profile/profile-edit/profile-edit.component').then(m => m.ProfileEditComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**', // Wildcard para rutas no encontradas
    redirectTo: 'home' // O a una página 'not-found' específica
  }
];