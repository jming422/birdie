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
