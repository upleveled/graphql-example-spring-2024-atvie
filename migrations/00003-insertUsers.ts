import { Sql } from 'postgres';

const users = [
  { id: 1, username: 'victor' },
  { id: 2, username: 'lukas' },
];

export async function up(sql: Sql) {
  for (const user of users) {
    await sql`
      INSERT INTO
        users (username)
      VALUES
        (
          ${user.username}
        )
    `;
  }
}

export async function down(sql: Sql) {
  for (const user of users) {
    await sql`
      DELETE FROM users
      WHERE
        id = ${user.id}
    `;
  }
}
