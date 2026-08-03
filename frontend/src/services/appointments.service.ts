import { api } from './api';
import { AvailableSlot, CreateAppointmentPayload, Appointment } from '../types';

export const appointmentsService = {
  create(payload: CreateAppointmentPayload) {
    return api.post<Appointment>('/appointments', payload).then((res) => res.data);
  },

  getDaySchedule(date: string) {
    return api.get<Appointment[]>('/appointments/day', { params: { date } }).then((res) => res.data);
  },

  // "Encontrar horário" do modal — slots livres do profissional no dia,
  // já considerando a duração escolhida.
  getAvailableSlots(dentistId: string, date: string, durationMinutes: number) {
    return api
      .get<AvailableSlot[]>('/appointments/available-slots', {
        params: { dentistId, date, durationMinutes },
      })
      .then((res) => res.data);
  },
};
