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

export interface GlobalContextValue {
  outingId: string;
  setOutingId: StateUpdater<string> | (() => void);
  userName: string;
  setUserName: StateUpdater<string> | (() => void);
}

export const GlobalContext = createContext<GlobalContextValue>({
  outingId: '',
  setOutingId: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  userName: '',
  setUserName: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
});
