import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';

describe('ArticleService', () => {
  let service: ArticleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DrizzlePGModule.register({
          tag: 'DB',
          pg: {
            connection: {
              config: {
                connectionString:
                  process.env.DATABASE_URL ||
                  'postgresql://postgres:postgres@localhost:5432/lionsmane',
              },
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
});
