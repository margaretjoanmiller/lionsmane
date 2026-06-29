import ky from 'ky';

import { db } from '@/db';
import { USER_AGENT } from '@/lib/constants';

import { type NewFeed } from './model';

export abstract class FeedService {
  static async newFeed(nf: NewFeed) {
    const result = await db.transaction(async (tx) => {
      let feed = await tx.query.feeds.findFirst({
        where: {
          url: nf.url,
        },
        columns: {
          id: true,
          url: true,
          etag_header: true,
        },
      });

      if (!feed?.etag_header) {
        const resp = await ky.get(nf.url, {
          headers: {
            'User-Agent': USER_AGENT,
          },
        });

        if (resp.status != 200) {
        }
      }
    });
  }
}
