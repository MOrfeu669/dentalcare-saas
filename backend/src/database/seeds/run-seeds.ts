import * as bcrypt from 'bcrypt';
import dataSource from '../../config/typeorm.config';
import { Clinic } from '../../modules/clinics/entities/clinic.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Room } from '../../modules/appointments/entities/room.entity';
import { Patient } from '../../modules/patients/entities/patient.entity';
import { SEED_CLINIC, SEED_PASSWORD, SEED_USERS, SEED_ROOMS, SEED_PATIENTS } from './seed-data';

/**
 * Idempotente: pode ser rodado várias vezes sem duplicar registros
 * (verifica por CNPJ/e-mail/CPF antes de inserir). Uso:
 *   npm run seed
 */
async function runSeeds() {
  await dataSource.initialize();
  console.log('🔌 Conectado ao banco. Iniciando seeds...\n');

  const clinicRepo = dataSource.getRepository(Clinic);
  const userRepo = dataSource.getRepository(User);
  const roomRepo = dataSource.getRepository(Room);
  const patientRepo = dataSource.getRepository(Patient);

  // ── Clínica ──────────────────────────────────────────────
  let clinic = await clinicRepo.findOne({ where: { cnpj: SEED_CLINIC.cnpj } });
  if (!clinic) {
    clinic = await clinicRepo.save(clinicRepo.create(SEED_CLINIC));
    console.log(`✅ Clínica criada: ${clinic.name} (${clinic.id})`);
  } else {
    console.log(`↷ Clínica já existia: ${clinic.name}`);
  }

  // ── Usuários ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  for (const seedUser of SEED_USERS) {
    const existing = await userRepo.findOne({ where: { email: seedUser.email } });
    if (existing) {
      console.log(`↷ Usuário já existia: ${seedUser.email}`);
      continue;
    }
    const user = userRepo.create({
      ...seedUser,
      clinicId: clinic.id,
      passwordHash,
      active: true,
    });
    await userRepo.save(user);
    console.log(`✅ Usuário criado: ${seedUser.email} [${seedUser.role}]`);
  }

  // ── Salas ────────────────────────────────────────────────
  for (const seedRoom of SEED_ROOMS) {
    const existing = await roomRepo.findOne({ where: { clinicId: clinic.id, name: seedRoom.name } });
    if (existing) {
      console.log(`↷ Sala já existia: ${seedRoom.name}`);
      continue;
    }
    await roomRepo.save(roomRepo.create({ ...seedRoom, clinicId: clinic.id, active: true }));
    console.log(`✅ Sala criada: ${seedRoom.name}`);
  }

  // ── Pacientes ────────────────────────────────────────────
  for (const seedPatient of SEED_PATIENTS) {
    const existing = await patientRepo.findOne({
      where: { clinicId: clinic.id, cpf: seedPatient.cpf },
    });
    if (existing) {
      console.log(`↷ Paciente já existia: ${seedPatient.name}`);
      continue;
    }
    await patientRepo.save(
      patientRepo.create({ ...seedPatient, clinicId: clinic.id, active: true }),
    );
    console.log(`✅ Paciente criado: ${seedPatient.name}`);
  }

  console.log('\n🌱 Seeds concluídos.');
  console.log(`   Login de teste: ${SEED_USERS[0].email} / senha: ${SEED_PASSWORD}`);

  await dataSource.destroy();
}

runSeeds().catch((err) => {
  console.error('❌ Falha ao rodar os seeds:', err);
  process.exit(1);
});
