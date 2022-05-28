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
import { route } from 'preact-router';

import { type Outing, useOutings, useCreateOuting } from '../../models/outing';
import { User } from '../../context';
import { Button, Callout, Container, Title } from '../../components/common';

const Card = ({ outingId, createdAt, name }: Outing) => {
  return (
    <div class="flex flex-col mb-8 p-4 overflow-hidden cursor-pointer bg-teal-200">
      <a href={`/outings/${outingId}`}>
        <div class="flex flex-col justify-between flex-1">
          <div class="flex space-x-1 text-sm text-slate-600">
            <span>{createdAt.toLocaleString()}</span>
          </div>
          <span class="block space-y-4">
            <h3 class="text-2xl font-semibold tracking-tighter">{name}</h3>
          </span>
        </div>
      </a>
    </div>
  );
};

const CardContainer = ({ outings }: { outings: Outing[] }) => {
  return (
    <div class="relative mx-auto max-w-7xl">
      <div class="grid max-w-lg gap-8 mx-auto mt-8 lg:grid-cols-3 lg:max-w-none">
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
    <Container>
      <Title>Hi, {user.name} - what&apos;s up?</Title>
      {!outings ? (
        'Loading...'
      ) : !outings.length ? (
        'No outings made yet'
      ) : (
        <CardContainer {...{ outings }} />
      )}
      <div>
        <Callout>Start a new outing! Just give it a name:</Callout>
        <div class="flex flex-row flex-1">
          <input onInput={handleInput} class="mr-2" />
          <Button onClick={createOutingAndRoute}>Add</Button>
        </div>
      </div>
    </Container>
  );
};

export default ListOutings;
