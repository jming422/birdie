/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import useFetch, { IncomingOptions } from 'use-http';
import { type DateTime } from 'luxon';
import { useCallback } from 'preact/hooks';

import { type Expense } from './expense';
import { useBlankSafeFetch } from '../utils';

export interface Outing {
  outingId: string;
  createdAt: DateTime;
  name: string;
}

export interface OutingDetails extends Outing {
  people: string[];
}

export interface Balance {
  total: number;
}

export interface OutingResult {
  from: string;
  to: string;
  amount: number;
}

export function useOutings() {
  return useFetch<Outing[]>('/outings', []);
}

export function useFinishOuting(id: string) {
  return useBlankSafeFetch<OutingResult[]>(`/outings/${id}/finish`, [id]);
}

export function useCreateOuting() {
  const { post } = useFetch<Outing>('/outings');

  return useCallback(
    (outingName: string, personName: string) =>
      post({ name: outingName, person_name: personName }),
    [post]
  );
}

export function useJoinOuting(outingId: string) {
  const { put } = useFetch<undefined>(`/outings/${outingId}/join`);

  return useCallback((personName: string) => put({ name: personName }), [put]);
}

export function useOuting(outingId: string, refresh = 0) {
  return useBlankSafeFetch<OutingDetails>(
    `/outings/${outingId}`,
    { cachePolicy: 'no-cache' } as IncomingOptions,
    [outingId, refresh]
  );
}

export function useOutingBalance(outingId: string, refresh = 0) {
  return useBlankSafeFetch<Balance>(
    `/outings/${outingId}/balance`,
    { cachePolicy: 'no-cache' } as IncomingOptions,
    [outingId, refresh]
  );
}

export function useOutingExpenses(outingId: string, refresh = 0) {
  return useBlankSafeFetch<Expense[]>(
    `/outings/${outingId}/expenses`,
    { cachePolicy: 'no-cache' } as IncomingOptions,
    [outingId, refresh]
  );
}
