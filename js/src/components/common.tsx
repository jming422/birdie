/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import {
  type FunctionalComponent,
  type JSX,
  type ComponentChildren,
  h,
} from 'preact';

export const Title: FunctionalComponent = ({ children }) => {
  return <h1 class="text-3xl font-semibold tracking-tighter">{children}</h1>;
};

export const Subtitle: FunctionalComponent<{
  children?: ComponentChildren;
  class?: string;
}> = ({ children, class: className }) => {
  return <h3 class={`text-xl font-semibold ${className ?? ''}`}>{children}</h3>;
};

export const Container: FunctionalComponent = ({ children }) => {
  return (
    <div class="flex flex-col max-w-prose mx-auto align-center">{children}</div>
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
> = ({ children, class: className, ...props }) => {
  return (
    <button
      class={`p-2 font-bold bg-cyan-500 hover:bg-cyan-400 text-white transition ${
        className ?? ''
      }`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Label: FunctionalComponent<
  JSX.HTMLAttributes<HTMLLabelElement>
> = ({ children, class: className, ...props }) => {
  return (
    <label class={`font-semibold ${className ?? ''}`} {...props}>
      {children}
    </label>
  );
};

export const Input: FunctionalComponent<
  JSX.HTMLAttributes<HTMLInputElement>
> = ({ children, class: className, ...props }) => {
  return (
    <input class={`p-1 ${className ?? ''}`} {...props}>
      {children}
    </input>
  );
};
