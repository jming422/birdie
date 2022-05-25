import { FunctionalComponent, h } from 'preact';
import { route } from 'preact-router';

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
  return (
    <div>
      <h1>{outing.name}</h1>
      <h3 class="flex flex-row justify-between">
        <div>
          {!balance
            ? 'Loading balance...'
            : `${formatUsd(balance.total)} spent on this outing so far`}
        </div>
        {showButton && (
          <button onClick={() => route(`/outings/${outing.outingId}/finish`)}>
            Finish Outing
          </button>
        )}
      </h3>
    </div>
  );
};

export default OutingHeader;
