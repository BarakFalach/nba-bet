export interface UserMetadata {
  displayName?: string;
  [key: string]: any; // Allow additional metadata fields
}

export interface User {
  id?: string;
  email?: string;
  user_metadata?: UserMetadata;
  [key: string]: any; // Allow additional fields from Supabase
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
}