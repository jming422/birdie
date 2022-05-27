/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { FunctionalComponent, h } from 'preact';
import { useContext, useState } from 'preact/hooks';

import { type Outing, useOutings, useCreateOuting } from '../../models/outing';
import { User } from '../../context';
import { route } from 'preact-router';

const Card = ({ outingId, createdAt, name }: Outing) => {
  return (
    <div class="flex flex-col mb-12 overflow-hidden cursor-pointer">
      <a href={`/outings/${outingId}`}>
        <div class="flex flex-col justify-between flex-1">
          <div class="flex pt-6 space-x-1 text-sm text-slate-500">
            <span>{createdAt.toLocaleString()}</span>
          </div>
          <span class="block mt-2 space-y-6">
            <h3 class="text-2xl font-semibold leading-none tracking-tighter">
              {name}
            </h3>
          </span>
        </div>
      </a>
    </div>
  );
};

const CardContainer = ({ outings }: { outings: Outing[] }) => {
  return (
    <div class="relative mx-auto max-w-7xl">
      <div class="grid max-w-lg gap-12 mx-auto mt-12 lg:grid-cols-3 lg:max-w-none">
        {outings.map((o) => (
          <Card key={o.outingId} {...o} />
        ))}
      </div>
    </div>
  );
};

export const ListOutings: FunctionalComponent = () => {
  const { user } = useContext(User);

  const { data: outings } = useOutings();
  const createOuting = useCreateOuting(user.personId);

  const [name, setName] = useState('');

  async function createOutingAndRoute() {
    if (name) {
      const { outingId } = await createOuting(name);
      route(`/outings/${outingId}`);
    }
  }

  function handleInput(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      setName(e.target.value);
    }
  }

  return (
    <div>
      <h1>Hi, {user.name} - what&apos;s up?</h1>
      {!outings ? (
        'Loading...'
      ) : !outings.length ? (
        'No outings made yet'
      ) : (
        <CardContainer {...{ outings }} />
      )}
      <div>
        Start a new outing! Just give it a name:
        <input onInput={handleInput} />
        <button onClick={createOutingAndRoute}>Add</button>
      </div>
    </div>
  );
};

export default ListOutings;
