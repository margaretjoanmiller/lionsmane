import { Queue } from 'bullmq';
import { connection } from '@/config/redis';

export const feedQueue = new Queue('feedQueue', {
  connection,
});

export const articleQueue = new Queue('articleQueue', {
  connection,
});
