import { api } from './api';
import { Dentist } from '../types';

export const dentistsService = {
  list() {
    return api.get<Dentist[]>('/dentists').then((res) => res.data);
  },
};
