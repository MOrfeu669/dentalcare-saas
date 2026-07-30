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
  room?: { name?: string };
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
}

export interface Material {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  active: boolean;
}

export interface TreatmentPlanItem {
  id: string;
  description: string;
  status: string;
  estimatedValue: number;
  completedAt?: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  dentistId: string;
  status: string;
  items: TreatmentPlanItem[];
  totalEstimatedValue: number;
}

export interface MedicalRecordSummary {
  patient: { id: string; name: string; birthDate: string };
  anamnesis: unknown;
  notes: unknown[];
  odontogram: unknown;
  files: Array<{ id: string; type: string; originalName: string; description?: string; createdAt?: string }>;
  treatmentPlans: TreatmentPlan[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
