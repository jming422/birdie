/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { type FunctionalComponent, h } from 'preact';
import {
  type StateUpdater,
  useContext,
  useState,
  useEffect,
} from 'preact/hooks';

import {
  Button,
  Container,
  Title,
  Subtitle,
  Input,
} from '../../components/common';
import { GlobalContext } from '../../context';
import { useCreateOuting, useJoinOuting } from '../../models/outing';

export const JoinOuting: FunctionalComponent = () => {
  const { setOutingId, userName, setUserName } = useContext(GlobalContext);

  // First we ask for name
  const [personName, setPersonName] = useState(userName);
  // There's a blink where userName is blank before it gets loaded from
  // sessionStorage (if it is there in sessionStorage). Catch that second render!
  useEffect(() => {
    if (userName) setPersonName(userName);
  }, [userName]);

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
      <Title>Hi there! </Title>
      <div class="my-4 w-full">
        <Subtitle>What&apos;s your name?</Subtitle>
        <Input
          value={personName}
          onInput={handleInput(setPersonName)}
          class="mt-2 w-2/5"
        />
      </div>

      <div class="my-4 w-full">
        <Subtitle>Join an outing by entering a join code:</Subtitle>
        <Input onInput={handleInput(setJoinCode)} class="mt-2 w-2/5" />
        <Button onClick={joinOutingAndRoute} class="block mt-2">
          Join!
        </Button>
      </div>

      <div class="my-4 w-full">
        <Subtitle>Or start a new outing! Just give it a name:</Subtitle>
        <Input onInput={handleInput(setOutingName)} class="mt-2 w-2/5" />
        <Button onClick={createOutingAndRoute} class="block mt-2">
          Create!
        </Button>
      </div>
    </Container>
  );
};

export default JoinOuting;
