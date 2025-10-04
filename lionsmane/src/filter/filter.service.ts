import { InjectQueue } from '@nestjs/bullmq';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { isAfter, subMonths } from 'date-fns';
import { and, eq, gte, ne, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Article } from 'src/article/article';
import { schema } from 'src/db/schema';
import { CreateFilterDto } from './dto/create-filter.dto';
import { UpdateFilterDto } from './dto/update-filter.dto';
import { AppliedRules, FilterRule } from './filter';

@Injectable()
export class FilterService {
  constructor(
    @Inject('DB') private db: NodePgDatabase<typeof schema>,
    @InjectQueue('filter') private filterQueue: Queue,
  ) {}

  async create(userId: string, createFilterDto: CreateFilterDto) {
    const [filter] = await this.db
      .insert(schema.userFilters)
      .values({
        ...createFilterDto,
        userId,
      })
      .returning();
    if (!filter) {
      throw new InternalServerErrorException('Filter not found');
    }
    const articles = await this.db
      .select({ articleId: schema.articles.id })
      .from(schema.articles)
      .where(gte(sql`${schema.articles.published}`, subMonths(Date.now(), 1)));
    for (const article of articles) {
      await this.filterQueue.add('filter-article', {
        articleId: article.articleId,
      });
    }

    return filter;
  }

  async findAll(userId: string) {
    return await this.db
      .select()
      .from(schema.userFilters)
      .where(eq(schema.userFilters.userId, userId));
  }

  async findOne(id: string, userId: string) {
    return await this.db
      .select()
      .from(schema.userFilters)
      .where(
        and(
          eq(schema.userFilters.id, id),
          eq(schema.userFilters.userId, userId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
  }

  async update(id: string, userId: string, updateFilterDto: UpdateFilterDto) {
    const [filter] = await this.db
      .update(schema.userFilters)
      .set({ ...updateFilterDto, userId })
      .where(
        and(
          eq(schema.userFilters.id, id),
          eq(schema.userFilters.userId, userId),
        ),
      )
      .returning();
    if (!filter) {
      throw new Error('Filter not found');
    }
    const articles = await this.db
      .select({ articleId: schema.articles.id })
      .from(schema.articles)
      .where(gte(sql`${schema.articles.published}`, subMonths(Date.now(), 1)));
    for (const article of articles) {
      await this.filterQueue.add('filter-article', {
        articleId: article.articleId,
      });
    }

    return filter;
  }

  async remove(id: string, userId: string) {
    return await this.db
      .delete(schema.userFilters)
      .where(
        and(
          eq(schema.userFilters.id, id),
          eq(schema.userFilters.userId, userId),
        ),
      )
      .returning();
  }

  // match article against all filters
  evaluateArticleAgainstFilters(
    article: Article,
    usersFilters: FilterRule[],
  ): AppliedRules[] {
    const actionPriority = { hide: 3, markRead: 2, blur: 1 };
    return usersFilters
      .filter((rule) => rule.enabled)
      .sort(
        (a, b) => actionPriority[a.action.type] - actionPriority[b.action.type],
      )
      .map((filter) => {
        if (
          filter.conditions.keywords &&
          filter.conditions.keywords.some((keyword) =>
            article.keywords.includes(keyword),
          )
        ) {
          return {
            ...filter,
            userId: filter.userId,
            action: filter.action.type,
            articleId: article.id,
            contentWarning: filter.action.contentWarning,
            appliedAt: new Date(),
            ruleId: filter.id,
          };
        }
        if (
          filter.conditions.authors &&
          filter.conditions.authors.some((author) =>
            article.authors.some(
              (a) => a.name === author || a.email === author,
            ),
          )
        ) {
          return {
            ...filter,
            userId: filter.userId,
            action: filter.action.type,
            articleId: article.id,
            contentWarning: filter.action.contentWarning,
            appliedAt: new Date(),
            ruleId: filter.id,
          };
        }
        if (
          filter.conditions.titleContains &&
          filter.conditions.titleContains.some((title) =>
            article.title?.includes(title),
          )
        )
          return {
            ...filter,
            userId: filter.userId,
            action: filter.action.type,
            articleId: article.id,
            appliedAt: new Date(),
            contentWarning: filter.action.contentWarning,
            ruleId: filter.id,
          };
        if (
          filter.conditions.contentContains &&
          filter.conditions.contentContains.some((content) =>
            article.readableText?.includes(content),
          )
        ) {
          return {
            ...filter,
            userId: filter.userId,
            action: filter.action.type,
            articleId: article.id,
            appliedAt: new Date(),
            contentWarning: filter.action.contentWarning,
            ruleId: filter.id,
          };
        }
        if (
          filter.conditions.feeds &&
          filter.conditions.feeds.some((feed) => article.feedId === feed)
        ) {
          return {
            ...filter,
            userId: filter.userId,
            action: filter.action.type,
            articleId: article.id,
            appliedAt: new Date(),
            contentWarning: filter.action.contentWarning,
            ruleId: filter.id,
          };
        }
        if (
          filter.conditions.categories &&
          filter.conditions.categories.some((category) =>
            article.categories.includes(category),
          )
        ) {
          return {
            ...filter,
            userId: filter.userId,
            action: filter.action.type,
            articleId: article.id,
            appliedAt: new Date(),
            contentWarning: filter.action.contentWarning,
            ruleId: filter.id,
          };
        }
      })
      .filter((action) => action !== undefined);
  }

  // apply matching filter rules to article
  async applyMatchingRules(
    articleId: string,
    userId: string,
    matchingRules: AppliedRules[],
  ) {
    return await this.db.transaction(async (tx) => {
      const currentState = await tx
        .select({
          isRead: schema.userArticleStates.isRead,
          isHidden: schema.userArticleStates.isHidden,
          isBlurred: schema.userArticleStates.isBlurred,
          contentWarning: schema.userArticleStates.contentWarning,
        })
        .from(schema.userArticleStates)
        .where(
          and(
            eq(schema.userArticleStates.articleId, articleId),
            eq(schema.userArticleStates.userId, userId),
          ),
        )
        .then((rows) => rows[0]);
      let finalState = {
        isRead: false,
        isHidden: false,
        isBlurred: false,
        contentWarning: [] as string[],
      };
      if (!currentState) {
        finalState = {
          isRead: false,
          isHidden: false,
          isBlurred: false,
          contentWarning: [],
        };
      } else {
        finalState = {
          isRead: currentState.isRead ?? false,
          isHidden: currentState.isHidden ?? false,
          isBlurred: currentState.isBlurred ?? false,
          contentWarning: currentState.contentWarning ?? [],
        };
      }

      const matchingRuleMarkRead = matchingRules.find(
        (r) => r.action === 'markRead',
      );
      if (matchingRuleMarkRead) {
        const [existingMarkRead] = await tx
          .select()
          .from(schema.appliedRules)
          .where(
            and(
              eq(schema.appliedRules.articleId, articleId),
              eq(schema.appliedRules.userId, userId),
              eq(schema.appliedRules.action, 'markRead'),
              eq(schema.appliedRules.isUndone, false),
            ),
          );
        if (existingMarkRead) {
          return;
        }

        await tx.insert(schema.appliedRules).values({
          userId,
          articleId,
          ruleId: matchingRuleMarkRead.ruleId,
          action: 'markRead',
        });
        finalState.isRead = true;
      }
      const matchingRuleHide = matchingRules.find((r) => r.action === 'hide');
      if (matchingRuleHide) {
        const [existingHide] = await tx
          .select()
          .from(schema.appliedRules)
          .where(
            and(
              eq(schema.appliedRules.articleId, articleId),
              eq(schema.appliedRules.userId, userId),
              eq(schema.appliedRules.action, 'hide'),
              eq(schema.appliedRules.isUndone, false),
            ),
          );
        if (existingHide) {
          return;
        }
        await tx.insert(schema.appliedRules).values({
          userId,
          articleId,
          ruleId: matchingRuleHide.ruleId,
          action: 'hide',
        });
        finalState.isHidden = true;
      }
      const matchingRuleBlur = matchingRules
        .sort((a, b) => {
          return isAfter(a.appliedAt, b.appliedAt) ? 1 : -1;
        })
        .findLast((r) => r.action === 'blur');
      if (matchingRuleBlur) {
        await tx.insert(schema.appliedRules).values({
          userId,
          articleId,
          ruleId: matchingRuleBlur.ruleId,
          action: 'blur',
          contentWarning: matchingRuleBlur.contentWarning,
        });
        if (
          matchingRuleBlur.ruleId === matchingRuleBlur.ruleId &&
          matchingRuleBlur.contentWarning
        ) {
          finalState.contentWarning = [];
          finalState.contentWarning.push(matchingRuleBlur.contentWarning);
        } else if (
          matchingRuleBlur.contentWarning &&
          !finalState.contentWarning.includes(matchingRuleBlur.contentWarning)
        ) {
          finalState.contentWarning.push(matchingRuleBlur.contentWarning);
        }
        finalState.isBlurred = true;
      }

      return await tx
        .insert(schema.userArticleStates)
        .values({
          userId,
          articleId,
          ...finalState,
        })
        .onConflictDoUpdate({
          target: [
            schema.userArticleStates.userId,
            schema.userArticleStates.articleId,
          ],
          set: {
            ...finalState,
          },
        })
        .returning();
    });
  }

  async undoRuleAction(articleId: string, userId: string, ruleId: string) {
    return await this.db.transaction(async (tx) => {
      const appliedRule = await tx
        .update(schema.appliedRules)
        .set({ isUndone: true, undoneAt: new Date() })
        .where(
          and(
            eq(schema.appliedRules.articleId, articleId),
            eq(schema.appliedRules.userId, userId),
            eq(schema.appliedRules.ruleId, ruleId),
            eq(schema.appliedRules.isUndone, false),
          ),
        )
        .returning()
        .then((rows) => rows[0]);

      if (!appliedRule) {
        throw new NotFoundException('No applied rule found to undo');
      }
      const otherActiveRules = await tx
        .select()
        .from(schema.appliedRules)
        .where(
          and(
            eq(schema.appliedRules.articleId, articleId),
            eq(schema.appliedRules.userId, userId),
            eq(schema.appliedRules.isUndone, false),
            // Exclude the rule being undone
            ne(schema.appliedRules.ruleId, ruleId),
          ),
        );
      await this.applyMatchingRules(articleId, userId, otherActiveRules);
    });
  }
}
