/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { route } from 'preact-router';
import { type FunctionalComponent, h, Fragment } from 'preact';
import { useContext } from 'preact/hooks';

import { Button, Title } from './common';
import { GlobalContext } from '../context';
import { formatUsd } from '../utils';
import { type Outing, type Balance } from '../models/outing';

export interface OutingHeaderProps {
  outing: Outing;
  balance?: Balance;
  showFinish?: boolean;
  showBack?: boolean;
}

const OutingHeader: FunctionalComponent<OutingHeaderProps> = ({
  outing,
  balance,
  showFinish = false,
  showBack = false,
}) => {
  const { setOutingId } = useContext(GlobalContext);
  function exitOuting() {
    setOutingId('');
  }

  return (
    <div>
      <div class="flex flex-row justify-between">
        <Title>{outing.name}</Title>
        <Title>Join code: {outing.outingId}</Title>
      </div>
      <h3 class="flex flex-row justify-between py-4">
        <div class="flex flex-col justify-center">
          <p class="text-xl leading-none">
            {!balance ? (
              'Loading balance...'
            ) : (
              <>
                <span class="font-semibold">{formatUsd(balance.total)}</span>{' '}
                spent by everyone so far
              </>
            )}
          </p>
        </div>
        <div>
          {showBack && (
            <Button onClick={() => history.back()} class="mr-4">
              Go Back
            </Button>
          )}
          {showFinish && (
            <Button onClick={() => route(`/finish`)} class="mr-4">
              Finish Outing
            </Button>
          )}
          <Button onClick={exitOuting}>Exit to Home</Button>
        </div>
      </h3>
    </div>
  );
};

export default OutingHeader;
