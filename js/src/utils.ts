/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { useEffect } from 'preact/hooks';
import useFetch, { UseFetch, UseFetchArgs } from 'use-http';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatUsd(x: number) {
  return USD_FORMAT.format(x);
}

export function useBlankSafeFetch<T>(...args: UseFetchArgs): UseFetch<T> {
  const depsArr = args.find(Array.isArray);
  if (depsArr) args.pop();

  const suspend = !!depsArr?.some((x) => x == null || x === '');

  const { get, ...rest } = useFetch(...args);

  useEffect(() => {
    if (!suspend) {
      console.debug(`[useBlankSafeFetch] ${args[0]} with deps ${depsArr}`);
      get();
    }
  }, [get, suspend, ...(depsArr ?? [])]); // eslint-disable-line react-hooks/exhaustive-deps

  return { get, ...rest };
}
