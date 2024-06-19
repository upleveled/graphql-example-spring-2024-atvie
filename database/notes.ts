import { cache } from 'react';
import { postgresToGraphql } from '../graphql/transform';
// import { postgresToGraphql } from '../graphql/transform';
import { Note } from '../migrations/00004-createTableNotes';
import { sql } from './connect';

export const createNote = cache(
  // FIXME: Rename insecureSessionToken to sessionToken everywhere
  async (insecureSessionToken: string, title: string, textContent: string) => {
    // FIXME: Remove this early return when proper session token validation is implemented (see FIXME in query below)
    if (
      insecureSessionToken !==
      'ae96c51f--fixme--insecure-hardcoded-session-token--5a3e491b4f'
    ) {
      return null;
    }

    const [note] = await sql<Note[]>`
      INSERT INTO
        notes (user_id, title, text_content)
        -- FIXME: Implement proper session token validation with subquery on sessions table to get userId
      VALUES
        (
          1,
          ${title},
          ${textContent}
        )
      RETURNING
        notes.*
    `;

    return postgresToGraphql(note);
  },
);

export const getNotes = cache(
  // FIXME: Rename insecureSessionToken to sessionToken everywhere
  async (insecureSessionToken: string) => {
    // FIXME: Remove this early return when proper session token validation is implemented (see FIXME in query below)
    if (
      insecureSessionToken !==
      'ae96c51f--fixme--insecure-hardcoded-session-token--5a3e491b4f'
    ) {
      return [];
    }
    const notes = await sql<Note[]>`
      SELECT
        notes.*
      FROM
        notes
        -- FIXME: Implement proper session token validation with INNER JOIN on sessions table
    `;
    return notes.map(postgresToGraphql);
  },
);

export const getNote = cache(
  // FIXME: Rename insecureSessionToken to sessionToken everywhere
  async (insecureSessionToken: string, noteId: number) => {
    // FIXME: Remove this early return when proper session token validation is implemented (see FIXME in query below)
    if (
      insecureSessionToken !==
      'ae96c51f--fixme--insecure-hardcoded-session-token--5a3e491b4f'
    ) {
      return null;
    }

    const [note] = await sql<Note[]>`
      SELECT
        notes.*
      FROM
        notes
        -- FIXME: Implement proper session token validation with INNER JOIN on sessions table
      WHERE
        notes.id = ${noteId}
    `;
    return postgresToGraphql(note);
  },
);
