import { Test, TestingModule } from '@nestjs/testing';
import { Rss } from 'feedsmith';
import { beforeEach, describe, expect, it } from 'vitest';
import { ParserService } from './parser.service';

describe('ParserService', () => {
  let service: ParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParserService],
    }).compile();

    service = module.get<ParserService>(ParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should normalize an RSS feed item', () => {
    const item = {
      title: 'Woah that happened???',
      link: 'https://example.com/woah-that-happened',
      pubDate: new Date('2007-12-03T10:15:30Z'),
      authors: ['Cool Guy', 'Cool Lady'],
      categories: [{ name: 'TIL', domain: 'https://example.com/til' }],
    } as Rss.Item<Date>;

    expect(
      service.normalizeRss(
        item,
        new Date('2007-12-03T10:15:30Z'),
        '019de97d-9b4c-7c23-88d0-6426ec2a810e',
      ),
    ).toBeDefined();
  });
});
