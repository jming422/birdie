/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { route } from 'preact-router';
import { type FunctionalComponent, h } from 'preact';
import { useContext, useEffect } from 'preact/hooks';

import {
  Balance,
  OutingDetails,
  OutingResult,
  useFinishOuting,
  useOuting,
  useOutingBalance,
} from '../../models/outing';
import { formatUsd } from '../../utils';
import { GlobalContext } from '../../context';
import OutingHeader from '../../components/outingHeader';
import { Container, Subtitle } from '../../components/common';

interface ResultsPageProps {
  outing: OutingDetails;
  balance?: Balance;
  results: OutingResult[];
}

const ResultsPage = ({ outing, balance, results }: ResultsPageProps) => {
  const { userName } = useContext(GlobalContext);

  const payingTo = [];
  const gettingFrom = [];
  const others = [];

  for (const result of results) {
    if (result.from === userName) payingTo.push(result);
    else if (result.to === userName) gettingFrom.push(result);
    else others.push(result);
  }

  return (
    <div>
      <OutingHeader {...{ outing, balance }} showBack />
      <div class="text-lg mt-2">
        <Subtitle>You owe:</Subtitle>
        <ul class="pt-1 pb-4 pl-4">
          {payingTo.length ? (
            payingTo.map(({ to, amount }) => (
              <li key={`to-${to}`}>
                {formatUsd(amount)} to {to}
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
                {formatUsd(amount)} from {from}
              </li>
            ))
          ) : (
            <li>Nothing, rats!</li>
          )}
        </ul>

        <Subtitle>Other peoples&apos; stuff:</Subtitle>
        <ul class="pt-1 pb-4 pl-4">
          {others.length ? (
            others.map(({ to, from, amount }) => (
              <li key={`others-${to}-${from}`}>
                {formatUsd(amount)} from {from} to {to}
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

export const ResultsRoute: FunctionalComponent = () => {
  const { outingId } = useContext(GlobalContext);

  useEffect(() => {
    if (!outingId) route('/');
  }, [outingId]);

  const { data: outing, error: outingError } = useOuting(outingId);
  const { data: balance, error: balanceError } = useOutingBalance(outingId);
  const { data: results, error: resultsError } = useFinishOuting(outingId);

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
