import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { FetcherService } from './fetcher.service';
import { RedisService } from 'src/redis/redis.service';

describe('FetcherService', () => {
  let service: FetcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FetcherService,
        {
          provide: RedisService,
          useValue: {
            getClient: vi.fn().mockReturnValue({
              on: vi.fn(),
              connect: vi.fn(),
            }),
          },
        },
        {
          provide: 'DB',
          useValue: {
            db: vi.fn(),
          },
        },
        {
          provide: 'BullQueue_article',
          useValue: {
            registerQueue: vi.fn().mockReturnValue({ name: 'article' }),
          },
        },
      ],
    }).compile();

    service = module.get<FetcherService>(FetcherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should extract keywords from text', async () => {
    const text = `Rare friend! I think that I cannot do better than be your
    disciple. Then before the trial with Meletus comes on I shall challenge
    him, and say that I have always had a great interest in religious
    questions, and now, as he charges me with rash imaginations and
    innovations in religion, I have become your disciple. You, Meletus, as
    I shall say to him, acknowledge Euthyphro to be a great theologian, and
    sound in his opinions; and if you approve of him you ought to approve of
    me, and not have me into court; but if you disapprove, you should begin
    by indicting him who is my teacher, and who will be the ruin, not of the
    young, but of the old; that is to say, of myself whom he instructs,
    and of his old father whom he admonishes and chastises. And if Meletus
    refuses to listen to me, but will go on, and will not shift the
    indictment from me to you, I cannot do better than repeat this challenge
    in the court.`;
    expect(await service.extractKeywords(text)).toEqual([
      'meletus',
      'disciple',
      'challenge',
      'court',
      'rare',
      'friend',
      'interest',
      'questions',
      'charges',
      'rash',
      'imaginations',
      'innovations',
      'religion',
      'euthyphro',
      'theologian',
      'sound',
      'opinions',
      'teacher',
      'ruin',
      'father',
      'admonishes',
      'shift',
      'indictment',
    ]);
  });

  it('Should extract robots txt', async () => {
    const robots = await service.robots('https://example.com/any/old/path');
    expect(robots).toBeDefined();
    expect(robots.getCrawlDelay()).toBe(10);
  });

  it('Should handle the respectful fetch', async () => {
    const url = 'https://example.com/any/old/path';
    const fetchedText = await service.respectfulFetch(url);
    expect(fetchedText).toEqual('mocked fetch');
  });

  it('Should extract feed title', async () => {
    const url = 'https://example.com/feed';
    const title = await service.extractFeedTitle(url);
    expect(title).toEqual('Hiking Treks');
  });

  it('Should generate readable text', async () => {
    const url = 'https://example.com/hiking-guide';
    const { textContent, htmlContent } = await service.readablity(url);
    expect(htmlContent.replace(/\s+/g, ' ')).toMatch(
      `<div id="readability-page-1" class="page"><p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p> </div>`,
    );
    expect(textContent).toMatch(
      'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
    );
  });
});
