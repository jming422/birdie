/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { type FunctionalComponent, type JSX, h } from 'preact';

export const Title: FunctionalComponent = ({ children }) => {
  return <h1 class="text-3xl font-semibold tracking-tighter">{children}</h1>;
};

export const Subtitle: FunctionalComponent = ({ children }) => {
  return <h3 class="text-xl font-semibold">{children}</h3>;
};

export const Container: FunctionalComponent = ({ children }) => {
  return (
    <div class="flex flex-col max-w-lg mx-auto align-center">{children}</div>
  );
};

export const Callout: FunctionalComponent = ({ children }) => {
  return (
    <p class="text-lg bg-teal-200 mx-auto my-4 py-2 text-center max-w-sm">
      {children}
    </p>
  );
};

export const Button: FunctionalComponent<
  JSX.HTMLAttributes<HTMLButtonElement>
> = ({ children, ...props }) => {
  return (
    <button class="p-2 font-bold bg-cyan-500 text-white" {...props}>
      {children}
    </button>
  );
};

export const Label: FunctionalComponent = ({ children }) => {
  return <label class="font-semibold mr-2">{children}</label>;
};
