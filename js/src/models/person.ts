/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
import { useCallback } from 'preact/hooks';
import useFetch from 'use-http';

export interface Person {
  personId: number;
  name: string;
}

export const NOBODY: Person = {
  personId: -1,
  name: 'Nobody',
};

export function usePersonList() {
  return useFetch<Person[]>('/people', []);
}

export function useCreatePerson() {
  const { post } = useFetch<Person>('/people');
  return useCallback((name: string) => post({ name }), [post]);
}

export function usePerson(personId: number) {
  return useFetch(`/people/${personId}`, [personId]);
}
