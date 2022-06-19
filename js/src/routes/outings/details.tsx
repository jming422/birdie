/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { DateTime } from 'luxon';
import { route } from 'preact-router';
import { type FunctionalComponent, Fragment, h } from 'preact';
import { useCallback, useContext, useEffect, useState } from 'preact/hooks';

import OutingHeader from '../../components/outingHeader';
import {
  Callout,
  Container,
  Label,
  Button,
  Input,
} from '../../components/common';
import { GlobalContext } from '../../context';
import { formatUsd } from '../../utils';
import { useCreateExpense, type Expense } from '../../models/expense';
import {
  type Balance,
  type OutingDetails,
  useOuting,
  useOutingBalance,
  useOutingExpenses,
} from '../../models/outing';

interface CreateExpenseProps {
  refreshExpenses: () => void;
}

const CreateExpense = ({ refreshExpenses }: CreateExpenseProps) => {
  const { outingId, userName } = useContext(GlobalContext);

  const createExpense = useCreateExpense(userName, outingId);

  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  async function createExpenseAndRefresh() {
    if (amount) {
      const trimmedDesc = description.replace(/\s+/g, ' ').trim();
      await createExpense(amount, trimmedDesc || undefined);
      refreshExpenses();
    }
  }

  function handleAmountInput(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      const maybeAmount = parseFloat(e.target.value.replace(/[, ]/g, ''));
      if (!isNaN(maybeAmount)) setAmount(maybeAmount);
    }
  }

  function handleDescInput(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      setDescription(e.target.value);
    }
  }

  return (
    <div class="mb-8">
      <Callout>Add a new expense:</Callout>
      <div class="mx-auto grid grid-cols-2 gap-x-2 gap-y-4 place-content-center max-w-sm text-right">
        <Label class="leading-none flex flex-col justify-center content-center">
          Description (optional):
        </Label>
        <Input onInput={handleDescInput} />
        <Label class="leading-none flex flex-col justify-center content-center">
          Amount:
        </Label>
        <Input onInput={handleAmountInput} pattern="\d*\.?\d+" />
      </div>
      <div class="flex justify-center content-center pt-4">
        <Button onClick={createExpenseAndRefresh}>Add</Button>
      </div>
    </div>
  );
};

interface OutingPageProps {
  outing: OutingDetails;
  balance?: Balance;
  expenses?: Expense[];
  refreshExpenses: () => void;
}

const OutingPage = ({
  outing,
  balance,
  expenses,
  refreshExpenses,
}: OutingPageProps) => {
  return (
    <div>
      <OutingHeader {...{ outing, balance }} showFinish />
      <div class="divide-y-8 divide-cyan-300 divide-double">
        <CreateExpense {...{ refreshExpenses }} />
        <ul class="pt-4 max-w-prose">
          {expenses?.map(
            ({ expenseId, amount, createdAt, personName, description }) => (
              <li key={expenseId} class="mb-1">
                <span class="font-semibold">{formatUsd(amount)}</span>
                <span> by </span>
                <span class="font-semibold">{personName}</span>
                <span> @ </span>
                <span class="italic">
                  {createdAt.toLocaleString(DateTime.DATETIME_FULL)}
                </span>
                {description && (
                  <>
                    <span> for </span>
                    <span class="font-semibold">{description}</span>
                  </>
                )}
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
};

export const OutingRoute: FunctionalComponent = () => {
  const { outingId } = useContext(GlobalContext);

  useEffect(() => {
    if (!outingId) route('/');
  }, [outingId]);

  const [refresh, setRefresh] = useState(0);
  const { data: outing, error: outingError } = useOuting(outingId);
  const { data: balance, error: balanceError } = useOutingBalance(
    outingId,
    refresh
  );
  const { data: expenses, error: expensesError } = useOutingExpenses(
    outingId,
    refresh
  );

  const incrRefresh = useCallback(() => setRefresh((x) => x + 1), []);

  const error = outingError ?? balanceError ?? expensesError;

  return (
    <Container>
      {error ? (
        <span>Error: {error.message}</span>
      ) : !outing ? (
        'Loading...'
      ) : (
        <OutingPage
          {...{ outing, balance, expenses }}
          refreshExpenses={incrRefresh}
        />
      )}
    </Container>
  );
};

export default OutingRoute;
