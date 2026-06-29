import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

import { relations } from './drizzle/relations';

export const db = drizzle(process.env.DATABASE_URL!, { relations: relations });
