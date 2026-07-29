import { api } from './api';
import { AuthenticatedUser, UserRole } from '../types';

interface LoginResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface RegisterClinicPayload {
  clinic: { name: string; cnpj: string; phone?: string; email?: string };
  admin: { name: string; email: string; password: string };
}

export interface RegisterStaffPayload {
  clinicCnpj: string;
  name: string;
  email: string;
  password: string;
  role: UserRole.DENTIST | UserRole.RECEPTIONIST;
  professionalLicense?: string;
}

function persistSession(data: LoginResponse): AuthenticatedUser {
  localStorage.setItem('dentalcare_token', data.accessToken);
  localStorage.setItem('dentalcare_user', JSON.stringify(data.user));
  return data.user;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthenticatedUser> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return persistSession(data);
  },

  // Cadastro de uma clínica nova (tenant novo) — já loga automaticamente
  // como admin ao final, mesma resposta shape do login.
  async registerClinic(payload: RegisterClinicPayload): Promise<AuthenticatedUser> {
    const { data } = await api.post<LoginResponse>('/auth/register/clinic', payload);
    return persistSession(data);
  },

  // Dentista ou funcionário se vinculando a uma clínica já existente
  // (identificada pelo CNPJ) — também já loga automaticamente.
  async registerStaff(payload: RegisterStaffPayload): Promise<AuthenticatedUser> {
    const { data } = await api.post<LoginResponse>('/auth/register/staff', payload);
    return persistSession(data);
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
