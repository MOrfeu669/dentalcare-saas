import { api } from './api';
import { AuthenticatedUser } from '../types';

interface LoginResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthenticatedUser> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    localStorage.setItem('dentalcare_token', data.accessToken);
    localStorage.setItem('dentalcare_user', JSON.stringify(data.user));
    return data.user;
  },

  logout() {
    localStorage.removeItem('dentalcare_token');
    localStorage.removeItem('dentalcare_user');
  },

  getStoredUser(): AuthenticatedUser | null {
    const raw = localStorage.getItem('dentalcare_user');
    return raw ? JSON.parse(raw) : null;
  },
};
