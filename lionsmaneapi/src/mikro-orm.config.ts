import 'dotenv/config';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';

export default defineConfig({
  multipleStatements: true,
  extensions: [Migrator],
  discovery: {
    // we need to disable validation for no entities, due to the entity generation
    warnWhenNoEntities: false,
  },
  entities: ['dist/entities/*.js'],
  entitiesTs: ['src/entities/*.ts'],
  host: process.env.POSTGRES_HOST || 'localhost',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  dbName: process.env.POSTGRES_DB,
  // enable debug mode to log SQL queries and discovery information
  debug: process.env.NODE_ENV !== 'production',
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
});
