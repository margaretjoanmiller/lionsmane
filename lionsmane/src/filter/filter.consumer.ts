import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq, getColumns, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '@/drizzle/drizzle.provider';
import { relations } from '@/drizzle/relations';
import * as schema from '@/drizzle/schema';
import { Enclosure } from '@/types/rss';
import { FilterService } from './filter.service';

@Processor('filter')
export class FilterConsumer extends WorkerHost {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema, typeof relations>,

    private filterService: FilterService,
  ) {
    super();
  }
  async process(job: Job<{ articleId: string }>) {
    const { articleId } = job.data;
    const [article] = await this.db
      .select({
        ...getColumns(schema.articles),
        enclosures:
          sql`(SELECT json_agg(enclosures) FROM ${schema.enclosures} WHERE ${schema.enclosures.entry_id} = ${schema.articles.minifluxId})`.as(
            'enclosures',
          ),
      })
      .from(schema.articles)
      .where(eq(schema.articles.id, articleId))
      .limit(1);
    if (!article) {
      throw new Error('Article not found');
    }
    const users = await this.db
      .select({
        id: schema.user.id,
      })
      .from(schema.user)
      .innerJoin(
        schema.subscriptions,
        eq(schema.user.id, schema.subscriptions.userId),
      )
      .where(eq(schema.subscriptions.feedId, article.feedId));
    const userIds = users.map((u) => u.id);
    for (const userId of userIds) {
      const activeRules = await this.db
        .select()
        .from(schema.userFilters)
        .where(eq(schema.userFilters.userId, userId));
      const rules = this.filterService.evaluateArticleAgainstFilters(
        {
          ...article,
          enclosures: article.enclosures as Enclosure[],
        },
        activeRules,
      );
      if (rules.length > 0) {
        await this.filterService.applyMatchingRules(article.id, userId, rules);
      }
    }
  }

  @OnWorkerEvent('error')
  handleError(job: Job) {
    console.error('Error in filter consumer', job.failedReason);
  }
}
