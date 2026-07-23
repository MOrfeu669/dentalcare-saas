/**
 * Perfis de acesso do sistema. Cada funcionário vê apenas o que sua
 * função precisa (requisito "Perfil de acesso").
 */
export enum UserRole {
  ADMIN = 'admin', // dono/gestor da clínica: acesso total ao tenant
  DENTIST = 'dentist', // acessa agenda própria, prontuários, planos de tratamento
  RECEPTIONIST = 'receptionist', // agenda, cadastro de pacientes, financeiro básico (recebimentos)
}

/** Payload decodificado do JWT, disponível via @CurrentUser() em qualquer controller. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  clinicId: string;
}
