import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { ArticleService } from '@/article/service';
import type { Services } from '@/db';
import { FeedService } from '@/feed/service';
import { FolderService } from '@/folder/service';

declare module 'fastify' {
  interface FastifyInstance {
    feedService: FeedService;
    articleService: ArticleService;
    folderService: FolderService;
    config: {
      PORT: number;
      CLIENT_ORIGIN: string;
    };
  }
}

export interface ServicesPluginOptions {
  svc: Services;
}

export default fp(
  async function servicesPlugin(
    fastify: FastifyInstance,
    options: ServicesPluginOptions,
  ) {
    fastify.decorate('feedService', new FeedService({ svc: options.svc }));
    fastify.decorate(
      'articleService',
      new ArticleService({ svc: options.svc }),
    );
    fastify.decorate('folderService', new FolderService({ svc: options.svc }));
  },
  { name: 'services' },
);
