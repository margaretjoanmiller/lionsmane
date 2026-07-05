import { InternalServerErrorException } from 'elysia-http-exception';
import { parseFeed } from 'feedsmith';
import ky from 'ky';
import { match } from 'ts-pattern';

import { db } from '@/db';
import { USER_AGENT } from '@/lib/constants';

import { type NewFeed } from './model';

export abstract class FeedService {
  static async newFeed(nf: NewFeed) {}
}
