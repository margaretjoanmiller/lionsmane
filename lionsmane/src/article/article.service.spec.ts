import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';

describe('ArticleService', () => {
  let service: ArticleService;

  beforeEach(async () => {
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
      providers: [ArticleService],
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
      authors: ['Author One', 'Author Two'],
      categories: ['Category1', 'Category2'],
      description: 'This is a test article.',
      readableText: 'This is the readable text of the test article.',
      keywords: ['test', 'article'],
      image: 'http://example.com/image.jpg',
      media: ['http://example.com/media.mp3'],
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
      feedId: 'feed-123',
    };

    const result = await service.newArticle(newArt);
    expect(result).toBeDefined();
    expect(result[0]).toMatchObject({
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
