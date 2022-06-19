/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import camelcaseKeys from 'camelcase-keys';
import { DateTime } from 'luxon';
import { type FunctionalComponent, h } from 'preact';
import { Provider as FetchProvider, type IncomingOptions } from 'use-http';
import { route, Route, Router } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';

import { GlobalContext } from '../context';

import JoinOuting from '../routes/outings/join';
import NotFoundPage from '../routes/notfound';
import Outing from '../routes/outings/details';
import OutingResults from '../routes/outings/results';

const fetchOpts: IncomingOptions = {
  interceptors: {
    response: async ({ response }) => {
      const res = response;
      if (res.data) {
        res.data = camelcaseKeys(res.data, { deep: true });

        if (res.data.createdAt)
          res.data.createdAt = DateTime.fromISO(res.data.createdAt);
        else if (Array.isArray(res.data))
          res.data.forEach((e) => {
            if (e.createdAt) e.createdAt = DateTime.fromISO(e.createdAt);
          });
      }
      return res;
    },
  },
};

const App: FunctionalComponent = () => {
  const [outingId, setOutingIdState] = useState('');
  const [userName, setUserNameState] = useState('');

  const setOutingId = (newVal: string) => {
    window.sessionStorage.setItem('outingId', newVal);
    setOutingIdState(newVal);
  };

  const setUserName = (newVal: string) => {
    window.sessionStorage.setItem('userName', newVal);
    setUserNameState(newVal);
  };

  // Initialize state to session storage values on first render
  useEffect(() => {
    const maybeUserName = window.sessionStorage.getItem('userName');
    if (maybeUserName) setUserName(maybeUserName);

    const maybeOutingId = window.sessionStorage.getItem('outingId');
    if (maybeOutingId && /^[A-Z0-9]+$/.test(maybeOutingId)) {
      setOutingId(maybeOutingId);
    }
  }, []);

  // Every time the outing changes (most importantly when it goes between blank
  // & nonblank), route to the outing details page if it is nonblank
  useEffect(() => {
    if (outingId) route(`/details`);
    else route(`/`);
  }, [outingId]);

  return (
    <div id="preact_root" class="bg-teal-100 text-slate-800 p-2">
      <FetchProvider url="/api" options={fetchOpts}>
        <GlobalContext.Provider
          value={{ outingId, setOutingId, userName, setUserName }}
        >
          <Router>
            <Route path="/" component={JoinOuting} />
            <Route path="/details" component={Outing} />
            <Route path="/finish" component={OutingResults} />
            <NotFoundPage default />
          </Router>
        </GlobalContext.Provider>
      </FetchProvider>
    </div>
  );
};

export default App;
