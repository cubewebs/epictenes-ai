// src/app/auth/interfaces/auth.interface.ts
import { User, AuthError } from '@supabase/supabase-js';

export interface UserCredentials {
  email: string;
  password?: string; // Opcional para algunos flujos como solo email para reset
}

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

// Podríamos añadir más interfaces según sea necesario, por ejemplo, para perfiles de usuario
export interface UserProfile {
  id?: string; // UUID de Supabase Auth
  username?: string;
  avatar_url?: string;
  website?: string;
  // Campos adicionales que definiste:
  first_name?: string;
  last_name?: string;
  terms?: boolean;
  dob?: Date | string;
  phone?: string;
  weight?: string;
  height?: string;
  role?: string; // Para roles de usuario
  name?: string;
  email?: string;
}