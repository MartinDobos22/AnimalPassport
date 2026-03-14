import type {
  DewormingRecord,
  DietEntry,
  EctoparasiteRecord,
  ExpenseRecord,
  MedicationDoseLog,
  MedicationRecord,
  VaccinationRecord,
  VetVisitRecord,
} from '../types/dogHealth';
import type { PetProfile } from '../types';

const BASE_URL = '/api/v1';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const dogHealthApi = {
  createDog: (payload: Partial<PetProfile>) => call<PetProfile>('/dogs', { method: 'POST', body: JSON.stringify(payload) }),
  getDog: (dogId: string) => call<PetProfile>(`/dogs/${dogId}`),
  updateDog: (dogId: string, payload: Partial<PetProfile>) => call<PetProfile>(`/dogs/${dogId}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  createVaccination: (dogId: string, payload: Omit<VaccinationRecord, 'id' | 'dogId'>) => call<VaccinationRecord>(`/dogs/${dogId}/vaccinations`, { method: 'POST', body: JSON.stringify(payload) }),
  listVaccinations: (dogId: string) => call<VaccinationRecord[]>(`/dogs/${dogId}/vaccinations`),
  updateVaccination: (dogId: string, id: string, payload: Partial<VaccinationRecord>) => call<VaccinationRecord>(`/dogs/${dogId}/vaccinations/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  createDeworming: (dogId: string, payload: Omit<DewormingRecord, 'id' | 'dogId' | 'nextDueDate'>) => call<DewormingRecord>(`/dogs/${dogId}/dewormings`, { method: 'POST', body: JSON.stringify(payload) }),
  listDewormings: (dogId: string) => call<DewormingRecord[]>(`/dogs/${dogId}/dewormings`),

  createEctoparasite: (dogId: string, payload: Omit<EctoparasiteRecord, 'id' | 'dogId' | 'nextDueDate'>) => call<EctoparasiteRecord>(`/dogs/${dogId}/ectoparasites`, { method: 'POST', body: JSON.stringify(payload) }),
  listEctoparasites: (dogId: string) => call<EctoparasiteRecord[]>(`/dogs/${dogId}/ectoparasites`),

  createVetVisit: (dogId: string, payload: Omit<VetVisitRecord, 'id' | 'dogId' | 'medicationIds'>) => call<VetVisitRecord>(`/dogs/${dogId}/vet-visits`, { method: 'POST', body: JSON.stringify(payload) }),
  listVetVisits: (dogId: string) => call<VetVisitRecord[]>(`/dogs/${dogId}/vet-visits`),

  createMedication: (dogId: string, payload: Omit<MedicationRecord, 'id' | 'dogId'>) => call<MedicationRecord>(`/dogs/${dogId}/medications`, { method: 'POST', body: JSON.stringify(payload) }),
  logDose: (dogId: string, medicationId: string, payload: Omit<MedicationDoseLog, 'id' | 'dogId' | 'medicationId'>) => call<MedicationDoseLog>(`/dogs/${dogId}/medications/${medicationId}/dose-logs`, { method: 'POST', body: JSON.stringify(payload) }),

  createDietEntry: (dogId: string, payload: Omit<DietEntry, 'id' | 'dogId'>) => call<DietEntry>(`/dogs/${dogId}/diet-entries`, { method: 'POST', body: JSON.stringify(payload) }),
  listDietEntries: (dogId: string) => call<DietEntry[]>(`/dogs/${dogId}/diet-entries`),

  createExpense: (dogId: string, payload: Omit<ExpenseRecord, 'id' | 'dogId'>) => call<ExpenseRecord>(`/dogs/${dogId}/expenses`, { method: 'POST', body: JSON.stringify(payload) }),
  listExpenses: (dogId: string) => call<ExpenseRecord[]>(`/dogs/${dogId}/expenses`),

  getVetCard: (dogId: string) => call(`/dogs/${dogId}/vet-card`),
  getSemaphores: (dogId: string) => call(`/dogs/${dogId}/semaphores`),
  getTimeline: (dogId: string) => call(`/dogs/${dogId}/timeline`),
};
