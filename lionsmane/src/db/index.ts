import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from './schema/auth';
import * as coreSchema from './schema/core';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...coreSchema,
    ...authSchema,
  },
});
