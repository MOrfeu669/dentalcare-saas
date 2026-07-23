export enum AppointmentStatus {
  SCHEDULED = 'scheduled', // agendado, aguardando confirmação
  CONFIRMED = 'confirmed', // paciente confirmou presença (via WhatsApp/SMS/e-mail)
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show', // paciente não compareceu e não avisou
}
