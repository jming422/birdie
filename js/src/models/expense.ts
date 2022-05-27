/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { type DateTime } from 'luxon';
import { useCallback } from 'preact/hooks';
import useFetch from 'use-http';

export interface Expense {
  expenseId: number;
  createdAt: DateTime;
  outingId: number;
  personId: number;
  amount: number;
  description?: string;
}

export function useCreateExpense(personId: number, outingId: number) {
  const { post } = useFetch<Expense>('/expenses');

  return useCallback(
    (amount: number, description?: string) =>
      post({
        outing_id: outingId,
        person_id: personId,
        amount,
        description,
      }),
    [personId, outingId, post]
  );
}
