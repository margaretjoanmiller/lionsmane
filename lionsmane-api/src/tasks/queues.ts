import { Queue } from 'bullmq';
import { connection } from '@/config/redis';

export interface FeedJob {
  feedUrl: string;
  feedId: string;
  userId: string;
}
export const feedQueue = new Queue<FeedJob>('feedQueue', {
  connection,
});

export interface ArticleJob {
  title: string;
  url: string;
  authors: string[];
  categories: string[];
  rawContent: string;
  description: string;
  image?: string;
  media: string[];
  published: Date;
  updated: Date | null;
  feedId: string;
  userId: string;
}
export const articleQueue = new Queue<ArticleJob>('articleQueue', {
  connection,
});
