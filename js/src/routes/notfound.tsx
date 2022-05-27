/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { FunctionalComponent, h } from 'preact';
import { Link } from 'preact-router/match';

const NotFound: FunctionalComponent = () => {
  return (
    <div>
      <h1>Page not found</h1>
      <p>That page doesn&apos;t exist! Try going back home:</p>
      <Link href="/">
        <h4>Back to Home</h4>
      </Link>
    </div>
  );
};

export default NotFound;
