import { UserRole } from '../../common/interfaces/user-role.enum';

/**
 * Dados de exemplo para ambiente de desenvolvimento/demonstração.
 * NUNCA rodar este seed contra um banco de produção com dados reais —
 * o run-seeds.ts é idempotente (não duplica), mas assume que é seguro
 * criar estes registros.
 */

export const SEED_CLINIC = {
  name: 'Clínica OdontoVida',
  cnpj: '12.345.678/0001-90',
  phone: '(51) 3333-4444',
  email: 'contato@odontovida.com.br',
  businessHours: {
    mon: [{ open: '08:00', close: '18:00' }],
    tue: [{ open: '08:00', close: '18:00' }],
    wed: [{ open: '08:00', close: '18:00' }],
    thu: [{ open: '08:00', close: '18:00' }],
    fri: [{ open: '08:00', close: '17:00' }],
    sat: [{ open: '08:00', close: '12:00' }],
  },
};

// Senha de todos os usuários de seed: "Senha123!" (só para ambiente local/demo)
export const SEED_PASSWORD = 'Senha123!';

export const SEED_USERS = [
  { name: 'Ana Beatriz Souza', email: 'admin@odontovida.com.br', role: UserRole.ADMIN },
  {
    name: 'Dr. Rafael Martins',
    email: 'rafael.martins@odontovida.com.br',
    role: UserRole.DENTIST,
    professionalLicense: 'CRO-RS 12345',
  },
  {
    name: 'Dra. Camila Ferreira',
    email: 'camila.ferreira@odontovida.com.br',
    role: UserRole.DENTIST,
    professionalLicense: 'CRO-RS 54321',
  },
  {
    name: 'Juliana Costa',
    email: 'juliana.costa@odontovida.com.br',
    role: UserRole.RECEPTIONIST,
  },
];

export const SEED_ROOMS = [{ name: 'Consultório 1' }, { name: 'Consultório 2' }, { name: 'Cadeira 3' }];

export const SEED_PATIENTS = [
  {
    name: 'Marcos Vinícius Oliveira',
    cpf: '111.222.333-44',
    birthDate: '1988-04-12',
    phone: '(51) 99111-2233',
    whatsapp: '(51) 99111-2233',
    email: 'marcos.oliveira@example.com',
    insuranceProvider: 'OdontoPrev',
    insurancePlanNumber: 'OP-998877',
  },
  {
    name: 'Fernanda Lima Santos',
    cpf: '222.333.444-55',
    birthDate: '1995-09-30',
    phone: '(51) 99222-3344',
    whatsapp: '(51) 99222-3344',
    email: 'fernanda.lima@example.com',
  },
  {
    name: 'Pedro Henrique Alves',
    cpf: '333.444.555-66',
    birthDate: '2016-01-20',
    phone: '(51) 99333-4455',
    whatsapp: '(51) 98888-7777', // celular do responsável
    emergencyContact: { name: 'Renata Alves', relationship: 'Mãe', phone: '(51) 98888-7777' },
  },
];