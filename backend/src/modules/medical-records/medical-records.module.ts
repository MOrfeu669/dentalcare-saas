import { Module } from '@nestjs/common';

/**
 * Prontuário eletrônico: histórico clínico, anamnese, evolução,
 * odontograma e upload de exames/radiografias (arquivos ficam no
 * Supabase Storage; aqui guardamos só a referência/URL assinada).
 */
@Module({})
export class MedicalRecordsModule {}

// TODO: entities/anamnesis.entity.ts        (perguntas/respostas de saúde do paciente)
// TODO: entities/clinical-note.entity.ts    (evolução: um registro por atendimento)
// TODO: entities/odontogram.entity.ts       (mapa dental jsonb: 32 dentes x condição/procedimento)
// TODO: entities/clinical-file.entity.ts    (radiografias/documentos: storage_path, tipo, data)
// TODO: MedicalRecordsService.getFullHistory(patientId) -> agrega tudo acima em uma view única
//       ("acessar todos os procedimentos e histórico do paciente de forma simples")
