/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { type FunctionalComponent, Fragment, h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { DateTime } from 'luxon';

import {
  useOuting,
  useOutingBalance,
  useOutingExpenses,
  type Balance,
  type OutingDetails,
} from '../../models/outing';
import { useCreateExpense, type Expense } from '../../models/expense';
import { formatUsd } from '../../utils';
import OutingHeader from '../../components/outingHeader';
import { Callout, Container, Label, Button } from '../../components/common';
import { GlobalContext } from 'src/context';

interface CreateExpenseProps {
  refresh: () => void;
}

const CreateExpense = ({ refresh }: CreateExpenseProps) => {
  const { outingId, userName } = useContext(GlobalContext);

  const createExpense = useCreateExpense(userName, outingId);

  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  async function createExpenseAndRefresh() {
    if (amount) {
      const trimmedDesc = description.replace(/\s+/g, ' ').trim();
      await createExpense(amount, trimmedDesc || undefined);
      refresh();
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
    <div class="my-2">
      <Callout>Add a new expense:</Callout>
      <div class="mb-2">
        <Label>Amount:</Label>
        <input onInput={handleAmountInput} />
      </div>
      <div class="mb-2">
        <Label>Description (optional): </Label>
        <input onInput={handleDescInput} />
      </div>
      <Button onClick={createExpenseAndRefresh}>Add</Button>
    </div>
  );
};

interface OutingPageProps {
  outing: OutingDetails;
  balance?: Balance;
  expenses?: Expense[];
  refresh: () => void;
}

const OutingPage = ({
  outing,
  balance,
  expenses,
  refresh,
}: OutingPageProps) => {
  return (
    <div>
      <OutingHeader {...{ outing, balance }} showButton />
      <CreateExpense {...{ refresh }} />
      <div class="pt-2">
        {/* TODO this spacing & divider thing is not working */}
        <div class="width-full height-100 bg-cyan-400" />
        <ul class="mt-2">
          {expenses?.map(({ expenseId, amount, createdAt, description }) => (
            <li key={expenseId} class="mb-1">
              <span class="font-semibold">{formatUsd(amount)}</span>
              {/* TODO italic is not working */}
              <span class="font-italic"> on </span>
              {createdAt.toLocaleString(DateTime.DATETIME_FULL)}
              {description && (
                <>
                  <span class="font-italic"> for </span>
                  <span class="font-semibold">{description}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const OutingRoute: FunctionalComponent = () => {
  const { outingId } = useContext(GlobalContext);

  const [refOut, refreshOuting] = useState(0);
  const { data: outing, error: outingError } = useOuting(outingId, refOut);
  const { data: balance, error: balanceError } = useOutingBalance(outingId);
  const { data: expenses, error: expensesError } = useOutingExpenses(outingId);

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
          refresh={() => refreshOuting((x) => x + 1)}
        />
      )}
    </Container>
  );
};

export default OutingRoute;
