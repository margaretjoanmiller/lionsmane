import 'dotenv/config';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';

import { Account } from './entities/Account';
import { ApikeySchema } from './entities/Apikey';
import { AppliedRules } from './entities/AppliedRules';
import { Articles } from './entities/Articles';
import { Base } from './entities/Base';
import { Enclosures } from './entities/Enclosures';
import { Feeds } from './entities/Feeds';
import { Folders } from './entities/Folders';
import { Jwks } from './entities/Jwks';
import { OauthAccessToken } from './entities/OauthAccessToken';
import { OauthClient } from './entities/OauthClient';
import { OauthConsent } from './entities/OauthConsent';
import { OauthRefreshToken } from './entities/OauthRefreshToken';
import { Passkey } from './entities/Passkey';
import { Session } from './entities/Session';
import { Subscriptions } from './entities/Subscriptions';
import { TwoFactor } from './entities/TwoFactor';
import { User } from './entities/User';
import { UserArticleStates } from './entities/UserArticleStates';
import { UserFilters } from './entities/UserFilters';
import { Verification } from './entities/Verification';

export default defineConfig({
  multipleStatements: true,
  extensions: [Migrator],
  discovery: {
    // we need to disable validation for no entities, due to the entity generation
    warnWhenNoEntities: false,
  },
  entities: [
    Account,
    ApikeySchema,
    AppliedRules,
    Articles,
    Base,
    Enclosures,
    Feeds,
    Folders,
    Jwks,
    OauthAccessToken,
    OauthClient,
    OauthConsent,
    OauthRefreshToken,
    Passkey,
    Session,
    TwoFactor,
    User,
    UserArticleStates,
    UserFilters,
    Verification,
    Subscriptions,
  ],
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
