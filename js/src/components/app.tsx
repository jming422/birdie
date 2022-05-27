/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { DateTime } from 'luxon';
import { FunctionalComponent, h } from 'preact';
import { Provider as FetchProvider, type IncomingOptions } from 'use-http';
import { route, Route, Router } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import camelcaseKeys from 'camelcase-keys';

import { User } from '../context';
import { NOBODY, type Person } from '../models/person';

import Home from '../routes/home';
import ListOutings from '../routes/outings/list';
import Outing from '../routes/outings/details';
import OutingResults from '../routes/outings/results';
import NotFoundPage from '../routes/notfound';

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
  const [user, setUser] = useState(NOBODY);

  useEffect(() => {
    if (user.personId === -1) {
      const userStorage = window.sessionStorage.getItem('user');
      let maybeUser: Person | undefined;
      if (userStorage) {
        try {
          maybeUser = JSON.parse(userStorage) as Person;
        } catch (_e) {
          // noop
        }
      }

      if (maybeUser?.personId && maybeUser.personId >= 0) {
        setUser(maybeUser);
      } else {
        route('/');
      }
    } else {
      window.sessionStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  return (
    <div id="preact_root">
      <FetchProvider url="/api" options={fetchOpts}>
        <User.Provider value={{ user, setUser }}>
          <Router>
            <Route path="/" component={Home} />
            <Route path="/outings" component={ListOutings} />
            <Route path="/outings/:id" component={Outing} />
            <Route path="/outings/:id/finish" component={OutingResults} />
            <NotFoundPage default />
          </Router>
        </User.Provider>
      </FetchProvider>
    </div>
  );
};

export default App;
