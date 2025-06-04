// src/app/auth/services/auth.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase/supabase.service';
import { UserCredentials, AuthResponse, UserProfile } from '../interfaces/auth.interface';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, AuthError } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  get currentUser$(): Observable<User | boolean | null | Error> {
    return this.supabaseService.currentUser$;
  }

  constructor(private supabaseService: SupabaseService) {}

  async signUp(credentials: { email: string, password_raw: string, data?: any }): Promise<AuthResponse> {
    try {
      const { data, error: signUpError } = await this.supabaseService.signUp({
        email: credentials.email,
        password_raw: credentials.password_raw, // El servicio SupabaseService internamente lo mapeará a 'password'
        options: {
          data: credentials.data
        }
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError.message);
        return { user: null, error: signUpError };
      }

      // Si signUpError es null, data debería ser { user, session }
      // AuthResponse espera { user: User | null, error: AuthError | null }
      if (!data || !data.user) {
        // Manejo defensivo por si Supabase no devuelve error pero tampoco usuario.
        console.error('Anomalía en SignUp: No se reportó error, pero no se encontraron datos de usuario.');
        return { 
          user: null, 
          error: { 
            name: 'SignUpAnomaly',
            message: 'No se reportó error, pero no se encontraron datos de usuario.' 
          } as AuthError
        };
      }
      
      return { user: data.user, error: null };
    } catch (e: any) {
      return { user: null, error: { name: 'SignUpException', message: e.message } as AuthError };
    }
  }

  async signIn(credentials: UserCredentials): Promise<AuthResponse> {
    if (!credentials.password) {
      return { user: null, error: { name: 'CredentialsError', message: 'Password is required for sign in.'} as AuthError };
    }
    try {
      const { data, error } = await this.supabaseService.signInWithPassword({ email: credentials.email, password_raw: credentials.password });
      if (error) {
        console.error('Sign in error:', error.message);
        return { user: null, error };
      }
      return { user: data.user, error: null };
    } catch (e: any) {
      return { user: null, error: { name: 'SignInException', message: e.message } as AuthError };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabaseService.signOut();
      if (error) {
        console.error('Sign out error:', error.message);
      }
      return { error };
    } catch (e: any) {
      return { error: { name: 'SignOutException', message: e.message } as AuthError };
    }
  }

  async sendPasswordResetEmail(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabaseService.sendPasswordResetEmail(email);
      if (error) {
        console.error('Password reset error:', error.message);
      }
      return { error };
    } catch (e: any) {
      return { error: { name: 'PasswordResetException', message: e.message } as AuthError };
    }
  }

  async updateUserPassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabaseService.updateUserPassword(newPassword);
       if (error) {
        console.error('Update password error:', error.message);
        return { user: null, error };
      }
      // La respuesta exitosa de updateUser de Supabase está en data.user
      return { user: data?.user || null, error: null };
    } catch (e: any) {
      return { user: null, error: { name: 'UpdatePasswordException', message: e.message } as AuthError };
    }
  }

  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: AuthError | null }> {
    const { data, error: pgError } = await this.supabaseService.getUserProfile(userId);
    if (pgError) {
      // Convert PostgrestError to AuthError
      // Usamos pgError.message, un status genérico 500, y el 'code' de PostgrestError como 'name'
      const authError = new AuthError(pgError.message, 500, pgError.code || 'PostgrestError');
      return { profile: null, error: authError };
    }
    return { profile: data as UserProfile, error: null };
  }

  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<{ profile: UserProfile | null; error: AuthError | null }> {
    const { data, error: pgError } = await this.supabaseService.updateUserProfile(userId, profileData);
    if (pgError) {
      // Convert PostgrestError to AuthError
      const authError = new AuthError(pgError.message, 500, pgError.code || 'PostgrestError');
      return { profile: null, error: authError };
    }
    return { profile: data as UserProfile, error: null };
  }

  isAuthenticated(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(userOrError => {
        if (userOrError instanceof Error) {
          return false; // Si hay un error, no está autenticado
        }
        // Si no es un error, se aplica la lógica original
        return !!userOrError && typeof userOrError !== 'boolean';
      })
    );
  }

  getCurrentUserId(): string | null {
    const currentUser = this.supabaseService.getCurrentUserSnapshot();
    if (currentUser && currentUser.id) {
      return currentUser.id;
    }
    return null;
  }
}