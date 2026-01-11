import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from '../drizzle/relations';
import * as schema from '../drizzle/schema';

const envUrl = process.env.DATABASE_URL;

if (!envUrl) {
  throw new Error(
    'DATABASE_URL is not defined in the environment. ' +
      'Ensure your .env file is in the current working directory or set the variable explicitly.',
  );
}
const connectionString = envUrl.replace('localhost', '127.0.0.1');

export const db = drizzle(connectionString, {
  schema,
  relations,
});
