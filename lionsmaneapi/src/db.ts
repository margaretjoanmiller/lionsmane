import { type EntityManager, MikroORM, type Options } from '@mikro-orm/postgresql';

import config from './mikro-orm.config.js';

export interface Services {
  orm: MikroORM;
  em: EntityManager;
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
  });
}
