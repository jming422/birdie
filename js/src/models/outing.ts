import useFetch from 'use-http';
import { type DateTime } from 'luxon';

import { type Expense } from './expense';
import { type Person } from './person';
import { useCallback } from 'preact/hooks';

export interface Outing {
  outingId: number;
  createdAt: DateTime;
  name: string;
}

export interface OutingDetails extends Outing {
  people: Person[];
}

export interface Balance {
  total: number;
}

export interface OutingResult {
  from: number;
  to: number;
  amount: number;
}

export function useOutings() {
  return useFetch<Outing[]>('/outings', []);
}

export function useFinishOuting(id: number) {
  return useFetch<OutingResult[]>(`/outings/${id}/finish`, [id]);
}

export function useCreateOuting(personId: number) {
  const { post } = useFetch<Outing>('/outings');

  return useCallback(
    (name: string) => post({ name, person_id: personId }),
    [personId, post]
  );
}

export function useOuting(outingId: number, refresh = 0) {
  return useFetch<OutingDetails>(`/outings/${outingId}`, [outingId, refresh]);
}

export function useOutingBalance(outingId: number) {
  return useFetch<Balance>(`/outings/${outingId}/balance`, [outingId]);
}

export function useOutingExpenses(outingId: number) {
  return useFetch<Expense[]>(`/outings/${outingId}/expenses`, [outingId]);
}
