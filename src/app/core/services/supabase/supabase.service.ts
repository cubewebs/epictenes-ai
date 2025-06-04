// src/app/core/services/supabase/supabase.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserProfile } from '../../../auth/interfaces/auth.interface';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public client!: SupabaseClient; // Usamos '!' porque se asignará condicionalmente
  private currentUserSubject = new BehaviorSubject<User | boolean | null | Error>(null);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    console.log('[SupabaseService] Constructor start');
    if (isPlatformBrowser(this.platformId)) {
      console.log('[SupabaseService] Running in browser context');
      if (!environment.supabaseUrl || !environment.supabaseKey) {
        console.error('[SupabaseService] Supabase URL and/or Key are missing in environment files.');
        const error = new Error('Supabase URL and Key must be provided in environment files.');
        this.currentUserSubject.next(error);
        throw error;
      }
      try {
        console.log('[SupabaseService] Attempting to create Supabase client...');
        this.client = createClient(environment.supabaseUrl, environment.supabaseKey, {
          auth: {
            storageKey: 'epictenes-auth-token-00102025', // Clave de almacenamiento específica para la aplicación
            autoRefreshToken: true,
            persistSession: true, // Sesión persistente en localStorage
            detectSessionInUrl: true
          }
        });
        console.log('[SupabaseService] Supabase client created successfully.');

        console.log('[SupabaseService] Subscribing to onAuthStateChange...');
        this.client.auth.onAuthStateChange((event, session) => {
          console.log('[SupabaseService] onAuthStateChange event received:', event, 'Session:', session);
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
            this.currentUserSubject.next(session?.user ?? false);
          } else if (event === 'SIGNED_OUT') {
            this.currentUserSubject.next(false);
          } else if (event === 'TOKEN_REFRESHED') {
            // Podrías querer manejar este evento también, aunque no directamente relacionado con el login/logout
            console.log('[SupabaseService] Token refreshed. New user state:', session?.user);
            this.currentUserSubject.next(session?.user ?? false); // Actualizar el usuario si es necesario
          } else if (event === 'USER_UPDATED'){
            console.log('[SupabaseService] User updated. New user state:', session?.user);
            this.currentUserSubject.next(session?.user ?? false);
          }
          // El console.log original ya estaba, lo mantenemos o lo integramos
          // console.log('Supabase Auth Event (Browser):', event, session);
        });
        console.log('[SupabaseService] Successfully subscribed to onAuthStateChange.');

      } catch (error: any) {
        console.error('[SupabaseService] CRITICAL: Error during Supabase client initialization or onAuthStateChange setup:', error);
        this.currentUserSubject.next(new Error(`Supabase client init failed: ${error.message}`));
        // Propagar el error para que sea visible
        throw error;
      }
    } else {
      // En el servidor, no inicializamos el cliente completo para evitar errores de APIs de navegador.
      // Puedes tener una implementación mock si necesitas alguna funcionalidad SSR.
      console.warn('Supabase client not fully initialized on the server.');
      // Asignar un mock mínimo para evitar errores si se llama a `this.client` en el servidor.
      this.client = {
        auth: {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signUp: async (credentials: any) => ({
            data: { user: null, session: null },
            error: { name: 'SSRError', message: 'Sign up not supported on server-side rendering.', status: 500 }
          }),
          signInWithPassword: async (credentials: any) => ({
            data: { user: null, session: null },
            error: { name: 'SSRError', message: 'Sign in not supported on server-side rendering.', status: 500 }
          }),
          signOut: async () => ({
            error: { name: 'SSRError', message: 'Sign out not supported on server-side rendering.', status: 500 }
          }),
          getSession: async () => ({
            data: { session: null },
            error: null
          }),
          // Considera mockear otras funciones de auth si tu AuthService las llama y podrían ejecutarse en SSR:
          // updateUser: async (attributes: any) => ({ data: { user: null }, error: { name: 'SSRError', message: 'Update user not supported on SSR.', status: 500 } }),
          // resetPasswordForEmail: async (email: string) => ({ data: {}, error: { name: 'SSRError', message: 'Password reset not supported on SSR.', status: 500 } })
        }
        // Si usas this.client.from() directamente en SSR, también necesitarías mockearlo.
        // from: (table: string) => ({ /* mock de operaciones de tabla */ })
      } as unknown as SupabaseClient; // Usar 'unknown as SupabaseClient' es más seguro que 'as any'
      this.currentUserSubject.next(false); // No hay usuario en el servidor por defecto
    }
  }

  public getCurrentUserSnapshot(): User | null {
    const userState = this.currentUserSubject.getValue();
    // Asegurarse de que userState es un objeto User válido y no un booleano o Error
    if (userState && typeof userState === 'object' && 'id' in userState && !(userState instanceof Error)) {
      return userState as User;
    }
    return null;
  }

  get currentUser$(): Observable<User | boolean | null | Error> {
    return this.currentUserSubject.asObservable();
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) {
      console.error('Error getting session:', error.message);
      this.currentUserSubject.next(false);
      return null;
    }
    this.currentUserSubject.next(data.session ? data.session.user : false);
    return data.session;
  }

  async signUp(credentials: { email: string, password_raw: string, options?: any }) {
    return this.client.auth.signUp({
      email: credentials.email,
      password: credentials.password_raw,
      options: credentials.options
    });
  }

  async signInWithPassword(credentials: { email: string, password_raw: string }) {
    return this.client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password_raw,
    });
  }

  async signOut() {
    return this.client.auth.signOut();
  }

  // Aquí podrían ir signOut si lo necesitas

  async getUserProfile(userId: string) {
    const { data, error } = await this.client
      .from('profiles') // Nombre de tu tabla
      .select('*')      // Selecciona todas las columnas o especifica las que necesites
      .eq('id', userId) // Filtra por el ID del usuario
      .single();        // Espera un único resultado
    return { data, error };
  }
  
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>) { // UserProfile de tus interfaces
    const { data, error } = await this.client
      .from('profiles')
      .update(profileData) // profileData debe ser un objeto con las columnas a actualizar
      .eq('id', userId)
      .select() // Devuelve los datos actualizados
      .single();
    return { data, error };
  }

  async sendPasswordResetEmail(email: string) {
    // Por defecto, Supabase enviará un correo al usuario con un enlace para restablecer la contraseña.
    // Puedes personalizar el comportamiento y las plantillas de correo electrónico en la configuración de tu proyecto Supabase.
    // También puedes pasar una opción `redirectTo` para redirigir al usuario a una URL específica después de que hagan clic en el enlace.
    // Ejemplo: return this.client.auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:4200/auth/update-password' });
    return this.client.auth.resetPasswordForEmail(email);
  }

  async updateUserPassword(newPassword: string) {
    const { data, error } = await this.client.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  }
}