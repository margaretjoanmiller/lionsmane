import {
  type EntityManager,
  EntityRepository,
  MikroORM,
  type Options,
} from '@mikro-orm/postgresql';

import config from './mikro-orm.config.js';
import { Articles } from './modules/Articles.js';
import { Feeds } from './modules/Feeds.js';
import { Subscriptions } from './modules/Subscriptions.js';

export interface Services {
  orm: MikroORM;
  em: EntityManager;
  feeds: EntityRepository<Feeds>;
  articles: EntityRepository<Articles>;
  subscriptions: EntityRepository<Subscriptions>;
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
  });
}
