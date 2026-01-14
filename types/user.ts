export type UserRole = 'admin' | 'user' | 'viewer';

export interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  created_at: string;
}

export interface SessionData {
  user?: {
    id: number;
    username: string;
    name: string;
    role: UserRole;
  };
  isLoggedIn: boolean;
}
