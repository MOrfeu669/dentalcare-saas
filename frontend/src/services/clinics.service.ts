import { api } from './api';
import { Clinic } from '../types';

export const clinicsService = {
  getMine() {
    return api.get<Clinic>('/clinics/me').then((res) => res.data);
  },
};
