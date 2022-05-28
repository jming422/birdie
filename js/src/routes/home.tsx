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
import { useContext, useState } from 'preact/hooks';

import { User } from '../context';
import { type Person, useCreatePerson, usePersonList } from '../models/person';

import { Button, Callout, Container, Title } from '../components/common';

const Home: FunctionalComponent = () => {
  const { setUser } = useContext(User);

  const { data, error } = usePersonList();
  const createPerson = useCreatePerson();

  const [name, setName] = useState('');

  function setPerson(person: Person) {
    setUser(person);
    route('/outings');
  }

  async function createAndSetPerson() {
    setPerson(await createPerson(name));
  }

  function handleInput(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      setName(e.target.value);
    }
  }

  return (
    <Container>
      <Title>Who are you?</Title>
      {error ? (
        <p class="text-red-500 font-semibold">Error: {error.message}</p>
      ) : !data ? (
        <p class="text-slate-600">Loading...</p>
      ) : (
        <div>
          <ul class="py-4 space-y-1 text-xl">
            {/* TODO underline */}
            {data.map((p, i) => (
              <li key={i} onClick={() => setPerson(p)}>
                {p.name}
              </li>
            ))}
          </ul>
          <Callout>
            {/* TODO border radius */}
            Not here? Add yourself! What&apos;s your name?
          </Callout>
          <div class="flex flex-row flex-1">
            <input onInput={handleInput} class="mr-2" />
            <Button onClick={createAndSetPerson}>
              {/* TODO border radius */}
              Add
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Home;
