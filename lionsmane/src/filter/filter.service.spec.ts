import { Test, TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { vi } from 'vitest';
import { coreSchema } from '@/db';
import { relations } from '@/drizzle/relations';
import { FilterService } from './filter.service';

describe('FilterService', () => {
  let service: FilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilterService,
        {
          provide: 'DrizzleAsyncProvider',
          useValue: drizzle.mock({
            schema: coreSchema,
            relations,
          }),
        },
        {
          provide: 'BullQueue_filter',
          useClass: vi.fn(
            class {
              addBulk = vi.fn();
              add = vi.fn();
            },
          ),
        },
      ],
    }).compile();

    service = module.get<FilterService>(FilterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
