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

export enum AppointmentType {
  CONSULTATION = 'consultation',
  COMMITMENT = 'commitment',
}

export interface Appointment {
  id: string;
  type: AppointmentType;
  patientId: string | null;
  dentistId: string;
  roomId?: string;
  procedureId?: string;
  treatmentPlanId?: string;
  title?: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  autoConfirmationEnabled: boolean;
  label?: string;
  labelColor?: string;
  returnOfAppointmentId?: string;
  notes?: string;
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
export interface ReturnSchedule {
  days?: 7 | 15 | 30;
  specificDate?: string;
}

export interface CreateAppointmentPayload {
  type: AppointmentType;
  patientId?: string;
  title?: string;
  dentistId: string;
  roomId?: string;
  startTime: string;
  endTime: string;
  notes?: string;
  autoConfirmationEnabled?: boolean;
  label?: string;
  labelColor?: string;
  returnSchedule?: ReturnSchedule;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}

export interface Dentist {
  id: string; // id do DentistProfile (não confundir com user.id, usado como dentistId nas consultas)
  user: { id: string; name: string };
  specialties: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
