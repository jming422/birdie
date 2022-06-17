/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import useFetch from 'use-http';
import { type DateTime } from 'luxon';
import { useCallback } from 'preact/hooks';

export interface Expense {
  expenseId: number;
  createdAt: DateTime;
  outingId: string;
  personName: string;
  amount: number;
  description?: string;
}

export function useCreateExpense(personName: string, outingId: string) {
  const { post } = useFetch<Expense>('/expenses');

  return useCallback(
    (amount: number, description?: string) =>
      post({
        outing_id: outingId,
        person_name: personName,
        amount,
        description,
      }),
    [personName, outingId, post]
  );
}
