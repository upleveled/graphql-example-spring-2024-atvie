import 'server-only';
import postgres, { Sql } from 'postgres';
import { postgresConfig, setEnvironmentVariables } from '../util/config';

// This loads all environment variables from a .env file
// for all code after this line
setEnvironmentVariables();

// Type needed for the connection function below
declare module globalThis {
  let postgresSqlClient: Sql;
}

// Connect only once to the database
// https://github.com/vercel/next.js/issues/7811#issuecomment-715259370
function connectOneTimeToDatabase() {
  if (!('postgresSqlClient' in globalThis)) {
    globalThis.postgresSqlClient = postgres(postgresConfig);
  }
  return globalThis.postgresSqlClient;
}

// Connect to PostgreSQL
export const sql = connectOneTimeToDatabase();
