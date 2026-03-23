import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { FetcherService } from '@/fetcher/fetcher.service';
import { ArticleService } from './article.service';

describe('ArticleService', () => {
  let service: ArticleService;

  let fetcherService: FetcherService;
  beforeEach(async () => {
    fetcherService = {
      readability: vi.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DrizzlePGModule.register({
          tag: 'DB',
          pg: {
            connection: 'pool',
            config: {
              connectionString:
                process.env.DATABASE_URL ||
                'postgresql://postgres:postgres@localhost:5432/lionsmane',
            },
          },
        }),
      ],
      providers: [
        ArticleService,
        {
          provide: 'BullQueue_article',
          useValue: {
            registerQueue: vi.fn().mockReturnValue({ name: 'article' }),
          },
        },
        {
          provide: 'DB',
          useValue: {
            db: vi.fn(),
            transaction: vi.fn(),
          },
        },
        {
          provide: FetcherService,
          useValue: fetcherService,
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('newArticle should insert an article', async () => {
    const newArt = {
      title: 'Test Article',
      url: 'http://example.com/test-article',
      authors: [{ name: 'Author one' }],
      categories: [{ term: 'Category1' }],
      description: 'This is a test article.',
      readableText: 'This is the readable text of the test article.',
      keywords: ['test', 'article'],
      image: 'http://example.com/image.jpg',
      media: {
        contents: [
          {
            url: 'http://example.com/art.mp3',
          },
        ],
      },
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
      feedId: 'feed-123',
      enclosures: null,
    };

    const result = await service.newArticle(newArt);
    // expect(result).toBeDefined();
    expect(result).toMatchObject({
      title: newArt.title,
      url: newArt.url,
      authors: newArt.authors,
      categories: newArt.categories,
      description: newArt.description,
      readableText: newArt.readableText,
      keywords: newArt.keywords,
      image: newArt.image,
      media: newArt.media,
      feedId: newArt.feedId,
    });
  });
});
