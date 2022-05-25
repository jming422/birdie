import { FunctionalComponent, h } from 'preact';
import { useContext, useState } from 'preact/hooks';

import {
  useOuting,
  useOutingBalance,
  useOutingExpenses,
  type Balance,
  type OutingDetails,
} from '../../models/outing';
import { useCreateExpense, type Expense } from '../../models/expense';
import { formatUsd } from '../../utils';
import { User } from '../../context';
import OutingHeader from '../../components/outingHeader';

interface CreateExpenseProps {
  outingId: number;
  refresh: () => void;
}

const CreateExpense = ({ outingId, refresh }: CreateExpenseProps) => {
  const {
    user: { personId },
  } = useContext(User);

  const createExpense = useCreateExpense(personId, outingId);

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
    <div>
      Add a new expense:
      <div>
        <label>Amount: </label> <input onInput={handleAmountInput} />
      </div>
      <div>
        <label>Description (optional): </label>
        <input onInput={handleDescInput} />
      </div>
      <button onClick={createExpenseAndRefresh}>Add</button>
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
      <CreateExpense outingId={outing.outingId} refresh={refresh} />
      <ul>
        {expenses?.map(({ expenseId, amount, createdAt, description }) => (
          <li key={expenseId}>
            {formatUsd(amount)} at {createdAt.toLocaleString()}
            {description && ` for ${description}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

interface OutingRouteProps {
  id: number;
}

export const OutingRoute: FunctionalComponent<OutingRouteProps> = ({ id }) => {
  const [refOut, refreshOuting] = useState(0);
  const { data: outing, error: outingError } = useOuting(id, refOut);
  const { data: balance, error: balanceError } = useOutingBalance(id);
  const { data: expenses, error: expensesError } = useOutingExpenses(id);

  const error = outingError ?? balanceError ?? expensesError;

  return (
    <div>
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
    </div>
  );
};

export default OutingRoute;
