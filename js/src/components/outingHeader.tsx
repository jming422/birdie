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
import { useContext } from 'preact/hooks';

import { Button, Callout, Title } from './common';
import { GlobalContext } from '../context';
import { formatUsd } from '../utils';
import { type Outing, type Balance } from '../models/outing';

export interface OutingHeaderProps {
  outing: Outing;
  balance?: Balance;
  showButton?: boolean;
}

const OutingHeader: FunctionalComponent<OutingHeaderProps> = ({
  outing,
  balance,
  showButton = false,
}) => {
  const { setOutingId, setUserName } = useContext(GlobalContext);
  function exitOuting() {
    setUserName('');
    setOutingId('');
  }

  return (
    <div>
      <Title>{outing.name}</Title>
      <h3 class="flex flex-row justify-between align-center py-2">
        <div class="text-xl">
          {!balance
            ? 'Loading balance...'
            : `${formatUsd(balance.total)} spent on this outing so far`}
        </div>
        <Button onClick={exitOuting}>Exit to Home</Button>
        {showButton && (
          <Button onClick={() => route(`/finish`)}>Finish Outing</Button>
        )}
      </h3>
      <Callout>Join code: {outing.outingId}</Callout>
    </div>
  );
};

export default OutingHeader;
