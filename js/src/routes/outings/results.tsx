/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
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
import { Container, Subtitle } from '../../components/common';

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
      <div class="text-lg mt-2">
        <Subtitle>You owe:</Subtitle>
        <ul class="pt-1 pb-4 pl-4">
          {payingTo.length ? (
            payingTo.map(({ to, amount }) => (
              <li key={`to-${to}`}>
                {formatUsd(amount)} to {getPersonName(to)}
              </li>
            ))
          ) : (
            <li>Nobody, nice!</li>
          )}
        </ul>
        <Subtitle>You are owed:</Subtitle>
        <ul class="pt-1 pb-4 pl-4">
          {gettingFrom.length ? (
            gettingFrom.map(({ from, amount }) => (
              <li key={`from-${from}`}>
                {formatUsd(amount)} from {getPersonName(from)}
              </li>
            ))
          ) : (
            <li>Nothing, rats!</li>
          )}
        </ul>

        <Subtitle>Other peoples&apos; stuff</Subtitle>
        <ul class="pt-1 pb-4 pl-4">
          {others.length ? (
            others.map(({ to, from, amount }) => (
              <li key={`others-${to}-${from}`}>
                {formatUsd(amount)} from {getPersonName(from)} to{' '}
                {getPersonName(to)}
              </li>
            ))
          ) : (
            <li>Nothin to see here</li>
          )}
        </ul>
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
    <Container>
      {error ? (
        <span>Error: {error.message}</span>
      ) : !outing || !results ? (
        'Loading...'
      ) : (
        <ResultsPage {...{ outing, balance, results }} />
      )}
    </Container>
  );
};

export default ResultsRoute;
