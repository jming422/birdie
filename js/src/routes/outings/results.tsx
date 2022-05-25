import { FunctionalComponent, h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';

import {
  Balance,
  OutingDetails,
  OutingResult,
  useFinishOuting,
  useOuting,
  useOutingBalance,
} from '../../models/outing';
import { formatUsd } from '../../utils';
import { User } from '../../context';
import OutingHeader from '../../components/outingHeader';

interface ResultsPageProps {
  outing: OutingDetails;
  balance?: Balance;
  results: OutingResult[];
}

const ResultsPage = ({ outing, balance, results }: ResultsPageProps) => {
  const {
    user: { personId: userId },
  } = useContext(User);

  const payingTo = [];
  const gettingFrom = [];
  const others = [];

  for (const result of results) {
    if (result.from === userId) payingTo.push(result);
    else if (result.to === userId) gettingFrom.push(result);
    else others.push(result);
  }

  const getPersonName = useCallback(
    (id: number) => {
      const person = outing.people.find(({ personId }) => id === personId);
      return person?.name;
    },
    [outing]
  );

  return (
    <div>
      <OutingHeader {...{ outing, balance }} />
      <div>
        <h2>You owe:</h2>
        {payingTo.length ? (
          <ul>
            {payingTo.map(({ to, amount }) => (
              <li key={`to-${to}`}>
                {formatUsd(amount)} to {getPersonName(to)}
              </li>
            ))}
          </ul>
        ) : (
          'Nobody, nice!'
        )}
        <h2>You are owed:</h2>
        {gettingFrom.length ? (
          <ul>
            {gettingFrom.map(({ from, amount }) => (
              <li key={`from-${from}`}>
                {formatUsd(amount)} from {getPersonName(from)}
              </li>
            ))}
          </ul>
        ) : (
          'Nothing, rats!'
        )}

        <h2>{"Other peoples' stuff"}</h2>
        {others.length
          ? others.map(({ to, from, amount }) => (
              <li key={`others-${to}-${from}`}>
                {formatUsd(amount)} from {getPersonName(from)} to{' '}
                {getPersonName(to)}
              </li>
            ))
          : 'Nothin to see here'}
      </div>
    </div>
  );
};

interface ResultsRouteProps {
  id: number;
}

export const ResultsRoute: FunctionalComponent<ResultsRouteProps> = ({
  id,
}) => {
  const { data: outing, error: outingError } = useOuting(id);
  const { data: balance, error: balanceError } = useOutingBalance(id);
  const { data: results, error: resultsError } = useFinishOuting(id);

  const error = outingError ?? balanceError ?? resultsError;

  return (
    <div>
      {error ? (
        <span>Error: {error.message}</span>
      ) : !outing || !results ? (
        'Loading...'
      ) : (
        <ResultsPage {...{ outing, balance, results }} />
      )}
    </div>
  );
};

export default ResultsRoute;
