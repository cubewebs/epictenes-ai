import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';
import { User } from '@supabase/supabase-js';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router'; // Import RouterModule

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule], // Add RouterModule
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUserEmail$: Observable<string | null>;
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
    this.currentUserEmail$ = this.user$.pipe(
        map(user => user?.email || null)
    );
  }

  ngOnInit(): void {}

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/auth/login']);
  }
}