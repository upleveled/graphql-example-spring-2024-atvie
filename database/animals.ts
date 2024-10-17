import { cache } from 'react';
import { postgresToGraphql } from '../graphql/transform';
import type { Animal } from '../migrations/00000-createTableAnimals';
import { sql } from './connect';

export const createAnimal = cache(
  async (sessionToken: string, newAnimal: Omit<Animal, 'id'>) => {
    const [animal] = await sql<Animal[]>`
      INSERT INTO
        animals (first_name, type, accessory) (
          SELECT
            ${newAnimal.firstName},
            ${newAnimal.type},
            ${newAnimal.accessory}
          FROM
            sessions
          WHERE
            token = ${sessionToken}
            AND sessions.expiry_timestamp > now()
        )
      RETURNING
        animals.*
    `;

    return postgresToGraphql(animal);
  },
);

export const updateAnimal = cache(
  async (sessionToken: string, updatedAnimal: Animal) => {
    const [animal] = await sql<Animal[]>`
      UPDATE animals
      SET
        first_name = ${updatedAnimal.firstName},
        type = ${updatedAnimal.type},
        accessory = ${updatedAnimal.accessory}
      FROM
        sessions
      WHERE
        sessions.token = ${sessionToken}
        AND sessions.expiry_timestamp > now()
        AND animals.id = ${updatedAnimal.id}
      RETURNING
        animals.*
    `;
    return postgresToGraphql(animal);
  },
);

export const deleteAnimal = cache(async (sessionToken: string, id: number) => {
  const [animal] = await sql<Animal[]>`
    DELETE FROM animals USING sessions
    WHERE
      sessions.token = ${sessionToken}
      AND sessions.expiry_timestamp > now()
      AND animals.id = ${id}
    RETURNING
      animals.*
  `;

  return postgresToGraphql(animal);
});

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
