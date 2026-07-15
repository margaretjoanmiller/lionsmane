import type { MikroORM } from '@mikro-orm/postgresql';
import { type AwilixContainer, asClass, asValue, Lifetime } from 'awilix';

import { ArticleService } from '@/article/service';
import { type Services } from '@/db';
import { FeedService } from '@/feed/service';

declare module '@fastify/awilix' {
  interface Cradle {
    svc: Services;
    orm: MikroORM;
    feedService: FeedService;
    articleService: ArticleService;
  }
}

export function configureContainer(container: AwilixContainer, svc: Services): AwilixContainer {
  container.register({
    orm: asValue(svc.orm),
    svc: asValue(svc),
    feedService: asClass(FeedService, { lifetime: Lifetime.SINGLETON }),
    articleService: asClass(ArticleService, { lifetime: Lifetime.SINGLETON }),
  });
  return container;
}
