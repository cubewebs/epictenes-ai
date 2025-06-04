import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RouterLinkActive } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLinkActive, RouterLink],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  menuOpen = false;
  isLoggedIn$: Observable<boolean>;
  user$: Observable<User | null>;

  constructor(private authService: AuthService, private router: Router) {
    this.user$ = this.authService.currentUser$.pipe(
      map(userOrBool => {
        if (userOrBool && typeof userOrBool !== 'boolean') {
          return userOrBool as User;
        }
        return null;
      })
    );
    this.isLoggedIn$ = this.user$.pipe(map(user => !!user));
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  async toggleLoginLogout(): Promise<void> {
    const user = await this.authService.currentUser$.pipe(map(u => u && typeof u !== 'boolean' ? u : null)).toPromise();
    if (user) {
      await this.authService.signOut();
      this.router.navigate(['/auth/login']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
} 