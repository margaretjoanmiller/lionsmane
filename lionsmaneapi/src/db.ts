import {
  type EntityManager,
  type EntityRepository,
  MikroORM,
  type Options,
} from '@mikro-orm/postgresql';

import { Articles } from './entities/Articles.js';
import { Feeds } from './entities/Feeds.js';
import { Folders } from './entities/Folders.js';
import { Subscriptions } from './entities/Subscriptions.js';
import { User } from './entities/User.js';
import config from './mikro-orm.config.js';

export interface Services {
  orm: MikroORM;
  em: EntityManager;
  feeds: EntityRepository<Feeds>;
  articles: EntityRepository<Articles>;
  subscriptions: EntityRepository<Subscriptions>;
  users: EntityRepository<User>;
  folders: EntityRepository<Folders>;
}

let cache: Services;

export async function initORM(options?: Partial<Options>): Promise<Services> {
  if (cache) {
    return cache;
  }

  const orm = await MikroORM.init({
    ...config,
    ...options,
  });

  return (cache = {
    orm,
    em: orm.em,
    feeds: orm.em.getRepository(Feeds),
    articles: orm.em.getRepository(Articles),
    subscriptions: orm.em.getRepository(Subscriptions),
    users: orm.em.getRepository(User),
    folders: orm.em.getRepository(Folders),
  });
}

export function forkServices(orm: MikroORM): Services {
  const em = orm.em.fork();
  return {
    orm,
    em,
    feeds: em.getRepository(Feeds),
    articles: em.getRepository(Articles),
    subscriptions: em.getRepository(Subscriptions),
    users: em.getRepository(User),
    folders: orm.em.getRepository(Folders),
  };
}
