/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { type FunctionalComponent, h } from 'preact';
import { type StateUpdater, useContext, useState } from 'preact/hooks';

import { Button, Callout, Container } from '../../components/common';
import { GlobalContext } from '../../context';
import { useCreateOuting, useJoinOuting } from '../../models/outing';

export const JoinOuting: FunctionalComponent = () => {
  const { setOutingId, setUserName } = useContext(GlobalContext);

  // First we ask for name
  const [personName, setPersonName] = useState('');

  // Then they can either join
  const [joinCode, setJoinCode] = useState('');
  const joinOuting = useJoinOuting(joinCode);

  // Or create
  const createOuting = useCreateOuting();

  const [outingName, setOutingName] = useState('');

  async function joinOutingAndRoute() {
    if (joinCode) {
      await joinOuting(personName);
      setUserName(personName);
      setOutingId(joinCode);
    }
  }

  async function createOutingAndRoute() {
    if (outingName && personName) {
      const { outingId } = await createOuting(outingName, personName);
      setUserName(personName);
      setOutingId(outingId);
    }
  }

  function handleInput(upd: StateUpdater<string>) {
    return (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        upd(e.target.value);
      }
    };
  }

  return (
    <Container>
      <div>
        <Callout>Hi there, what&apos;s your name?</Callout>
        <div class="flex flex-row flex-1">
          <input onInput={handleInput(setPersonName)} class="mr-2" />
        </div>
      </div>

      <div>
        <Callout>
          You can join someone else&apos;s outing by entering their join code:
        </Callout>
        <div class="flex flex-row flex-1">
          <input onInput={handleInput(setJoinCode)} class="mr-2" />
          <Button onClick={joinOutingAndRoute}>Join</Button>
        </div>
      </div>

      <div>
        <Callout>Or start a new outing! Just give it a name:</Callout>
        <div class="flex flex-row flex-1">
          <input onInput={handleInput(setOutingName)} class="mr-2" />
          <Button onClick={createOutingAndRoute}>Add</Button>
        </div>
      </div>
    </Container>
  );
};

export default JoinOuting;
