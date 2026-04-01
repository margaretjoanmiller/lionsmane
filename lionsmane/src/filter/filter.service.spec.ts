import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { coreSchema } from '@/db';
import { relations } from '@/drizzle/relations';
import { FilterRule } from './filter';
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

  it('should use the correct filter type', () => {
    const fakeKeywords = faker.helpers.multiple(
      () => {
        return faker.word.noun();
      },
      {
        count: 5,
      },
    );

    const fakeAuthors = faker.helpers.multiple(
      () => {
        return faker.person.fullName();
      },
      {
        count: 5,
      },
    );
    const exampleFilter: FilterRule = {
      id: 'd09846f4-9103-43ff-b35a-53950958ffcf',
      userId: 'a0842467-2bf9-431f-b722-3c2fc554245c',
      conditions: {
        keywords: fakeKeywords,
        authors: fakeAuthors,
      },
      action: {
        type: 'blur',
        contentWarning: faker.word.noun(),
      },
      enabled: true,
    };
  });
});
