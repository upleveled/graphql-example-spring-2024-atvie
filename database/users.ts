import { cache } from 'react';
import { postgresToGraphql } from '../graphql/transform';
// import { postgresToGraphql } from '../graphql/transform';
import { User } from '../migrations/00002-createTableUsers';
import { sql } from './connect';

export const getUser = cache(
  // FIXME: Rename insecureSessionToken to sessionToken everywhere
  async (insecureSessionToken: string) => {
    // FIXME: Remove this early return when proper session token validation is implemented (see FIXME in query below)
    if (
      insecureSessionToken !==
      'ae96c51f--fixme--insecure-hardcoded-session-token--5a3e491b4f'
    ) {
      return null;
    }

    const [user] = await sql<User[]>`
      SELECT
        *
      FROM
        users
      WHERE
        -- FIXME: Implement proper session token validation with INNER JOIN on sessions table
        username = 'victor'
    `;
    console.log(insecureSessionToken);
    return postgresToGraphql(user);
  },
);
