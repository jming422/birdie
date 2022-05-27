/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { createContext } from 'preact';
import { StateUpdater } from 'preact/hooks';

import { type Person, NOBODY } from './models/person';

export interface UserContext {
  user: Person;
  setUser: StateUpdater<Person> | (() => void);
}

export const User = createContext<UserContext>({
  user: NOBODY,
  setUser: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
});
