import { FunctionalComponent, h } from 'preact';
import { route } from 'preact-router';
import { useContext, useState } from 'preact/hooks';

import { User } from '../context';
import { type Person, useCreatePerson, usePersonList } from '../models/person';

const Home: FunctionalComponent = () => {
  const { setUser } = useContext(User);

  const { data, error } = usePersonList();
  const createPerson = useCreatePerson();

  const [name, setName] = useState('');

  function setPerson(person: Person) {
    setUser(person);
    route('/outings');
  }

  async function createAndSetPerson() {
    setPerson(await createPerson(name));
  }

  function handleInput(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      setName(e.target.value);
    }
  }

  return (
    <div>
      <h1>Who are you?</h1>
      {error ? (
        <p>Error: {error.message}</p>
      ) : !data ? (
        <p>Loading...</p>
      ) : (
        <div>
          <ul>
            {data.map((p, i) => (
              <li key={i} onClick={() => setPerson(p)}>
                {p.name}
              </li>
            ))}
          </ul>
          Not here? Add yourself! What&apos;s your name?
          <input onInput={handleInput} />
          <button onClick={createAndSetPerson}>Add</button>
        </div>
      )}
    </div>
  );
};

export default Home;
