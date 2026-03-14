import { createHash } from 'node:crypto';
import { faker } from '@faker-js/faker';
import type { Article } from '@/article/dto/article-detail.dto';

export function createFakeArticles(): Article {
  const hash = createHash('sha256')
    .update(`${faker.internet.url()}/${faker.lorem.paragraphs(5)}`, 'utf-8')
    .digest('hex');
  return {
    id: faker.string.uuid({
      version: 7,
    }),
    minifluxId: faker.number.int(),
    title: faker.lorem.sentence(),
    hash,
  };
}
