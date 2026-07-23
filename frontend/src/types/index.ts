export enum UserRole {
  ADMIN = 'admin',
  DENTIST = 'dentist',
  RECEPTIONIST = 'receptionist',
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clinicId: string;
  clinicName?: string;
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  insuranceProvider?: string;
  active: boolean;
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  roomId?: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
