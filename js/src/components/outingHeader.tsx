/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { FunctionalComponent, h } from 'preact';
import { route } from 'preact-router';

import { formatUsd } from '../utils';
import { type Outing, type Balance } from '../models/outing';
import { Button, Title } from './common';

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
  return (
    <div>
      <Title>{outing.name}</Title>
      <h3 class="flex flex-row justify-between align-center py-2">
        <div class="text-xl">
          {!balance
            ? 'Loading balance...'
            : `${formatUsd(balance.total)} spent on this outing so far`}
        </div>
        {showButton && (
          <Button onClick={() => route(`/outings/${outing.outingId}/finish`)}>
            Finish Outing
          </Button>
        )}
      </h3>
    </div>
  );
};

export default OutingHeader;
