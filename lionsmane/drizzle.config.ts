import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { upstashCache } from 'drizzle-orm/cache/upstash';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
