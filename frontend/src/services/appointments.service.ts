import { api } from './api';
import { AvailableSlot, CreateAppointmentPayload, Appointment, UpdateAppointmentPayload } from '../types';

export const appointmentsService = {
  create(payload: CreateAppointmentPayload) {
    return api.post<Appointment>('/appointments', payload).then((res) => res.data);
  },

  update(id: string, payload: UpdateAppointmentPayload) {
    return api.patch<Appointment>(`/appointments/${id}`, payload).then((res) => res.data);
  },

  reschedule(id: string, startTime: string, endTime: string) {
    return api
      .patch<Appointment>(`/appointments/${id}/reschedule`, { startTime, endTime })
      .then((res) => res.data);
  },

  cancel(id: string, reason: string) {
    return api.patch<Appointment>(`/appointments/${id}/cancel`, { reason }).then((res) => res.data);
  },

  confirm(id: string) {
    return api.patch<Appointment>(`/appointments/${id}/confirm`).then((res) => res.data);
  },

  complete(id: string) {
    return api.patch<Appointment>(`/appointments/${id}/complete`).then((res) => res.data);
  },

  getDaySchedule(date: string) {
    return api.get<Appointment[]>('/appointments/day', { params: { date } }).then((res) => res.data);
  },

  // Usado pela grade semanal/dia da Agenda.
  findInRange(from: string, to: string, dentistId?: string) {
    return api
      .get<Appointment[]>('/appointments', { params: { from, to, dentistId } })
      .then((res) => res.data);
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

