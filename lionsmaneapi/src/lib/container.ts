import type { MikroORM } from '@mikro-orm/postgresql';
import { type AwilixContainer, asClass, asFunction, asValue, Lifetime } from 'awilix';

import { forkServices, type Services } from '@/db';
import { FeedService } from '@/feed/service';

declare module '@fastify/awilix' {
  interface Cradle {
    svc: Services;
    orm: MikroORM;
    feedService: FeedService;
  }
}

export function configureContainer(container: AwilixContainer, orm: MikroORM): AwilixContainer {
  container.register({
    orm: asValue(orm),
    svc: asFunction(({ orm }) => forkServices(orm), { lifetime: Lifetime.SCOPED }),
    feedService: asClass(FeedService, { lifetime: Lifetime.SCOPED }),
  });
  return container;
}
