// src/app/core/guards/auth.guard.ts
import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  router = inject(Router);

  constructor(private authService: AuthService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.currentUser$.pipe(
      filter(userState => userState !== null), // Esperar hasta que el estado inicial (null) se resuelva
      take(1), // Tomar solo el primer valor emitido después del filtro
      map(user => {
        const isAuthenticated = !!user && typeof user !== 'boolean'; // true si user es un objeto User
        if (isAuthenticated) {
          return true;
        }
        // No autenticado, redirigir a la página de login
        return this.router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
      })
    );
  }
}