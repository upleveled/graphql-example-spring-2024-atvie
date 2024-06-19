import { cache } from 'react';
import { postgresToGraphql } from '../graphql/transform';
import { Animal } from '../migrations/00000-createTableAnimals';
import { sql } from './connect';

export const getAnimalsInsecure = cache(async () => {
  const animals = await sql<Animal[]>`
    SELECT
      *
    FROM
      animals
  `;
  return animals.map(postgresToGraphql);
});

export const getAnimalInsecure = cache(async (id: number) => {
  const [animal] = await sql<Animal[]>`
    SELECT
      *
    FROM
      animals
    WHERE
      id = ${id}
  `;
  return postgresToGraphql(animal);
});

export const createAnimal = cache(async (newAnimal: Omit<Animal, 'id'>) => {
  // FIXME: Remove this early return when proper session token validation is implemented (see FIXME in query below)
  // if (
  //   insecureSessionToken !==
  //   'ae96c51f--fixme--insecure-hardcoded-session-token--5a3e491b4f'
  // ) {
  //   return null;
  // }

  const [animal] = await sql<Animal[]>`
    INSERT INTO
      animals (first_name, type, accessory)
      -- FIXME: Implement proper session token validation with INNER JOIN on sessions table
    VALUES
      (
        ${newAnimal.firstName},
        ${newAnimal.type},
        ${newAnimal.accessory}
      )
    RETURNING
      animals.*
  `;

  return postgresToGraphql(animal);
});

export const updateAnimal = cache(
  async (
    // FIXME: Rename insecureSessionToken to sessionToken everywhere
    // insecureSessionToken: string,
    updatedAnimal: Animal,
  ) => {
    // FIXME: Remove this early return when proper session token validation is implemented (see FIXME in query below)
    // if (
    //   insecureSessionToken !==
    //   'ae96c51f--fixme--insecure-hardcoded-session-token--5a3e491b4f'
    // ) {
    //   return null;
    // }

    const [animal] = await sql<Animal[]>`
      UPDATE animals
      SET
        first_name = ${updatedAnimal.firstName},
        type = ${updatedAnimal.type},
        accessory = ${updatedAnimal.accessory}
        -- FIXME: Implement proper session token validation with INNER JOIN on sessions table
      WHERE
        id = ${updatedAnimal.id}
      RETURNING
        animals.*
    `;

    return postgresToGraphql(animal);
  },
);

export const deleteAnimal = cache(
  // FIXME: Rename insecureSessionToken to sessionToken everywhere
  async (animalId: number) => {
    // FIXME: Remove this early return when proper session token validation is implemented (see FIXME in query below)
    // if (
    //   insecureSessionToken !==
    //   'ae96c51f--fixme--insecure-hardcoded-session-token--5a3e491b4f'
    // ) {
    //   return null;
    // }

    const [animal] = await sql<Animal[]>`
      DELETE FROM animals
      -- FIXME: Implement proper session token validation with INNER JOIN on sessions table
      WHERE
        id = ${animalId}
      RETURNING
        animals.*
    `;
    return postgresToGraphql(animal);
  },
);
