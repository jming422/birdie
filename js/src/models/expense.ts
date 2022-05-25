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
