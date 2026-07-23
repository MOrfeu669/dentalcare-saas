import { api } from './api';
import { Patient, PaginatedResult } from '../types';

export const patientsService = {
  list(params: { page?: number; search?: string } = {}) {
    return api
      .get<PaginatedResult<Patient>>('/patients', { params })
      .then((res) => res.data);
  },

  getById(id: string) {
    return api.get<Patient>(`/patients/${id}`).then((res) => res.data);
  },

  create(payload: Partial<Patient>) {
    return api.post<Patient>('/patients', payload).then((res) => res.data);
  },

  update(id: string, payload: Partial<Patient>) {
    return api.patch<Patient>(`/patients/${id}`, payload).then((res) => res.data);
  },
};
