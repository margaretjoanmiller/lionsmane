import { subDays, subMonths } from 'date-fns';
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

import { parseArticlesRss } from '.';
import { resolveHash, joined } from '.';

describe('resolveHash (properties)', () => {
  it('returns null iff every candidate is empty/whitespace', () => {
    fc.assert(
      fc.property(fc.array(fc.string({ maxLength: 20, minLength: 1 })), (candidates) => {
        const result = resolveHash(...candidates);
        const allEmpty = candidates.every((c) => !c || c.trim() === '');
        expect(result === null).toBe(allEmpty);
      }),
    );
  });

  it('is deterministic: identical inputs ⇒ identical output', () => {
    fc.assert(
      fc.property(fc.array(fc.string({ maxLength: 40, minLength: 1 })), (candidates) => {
        expect(resolveHash(...candidates)).toBe(resolveHash(...candidates));
      }),
    );
  });
});

describe('joined (properties)', () => {
  it('trims its inputs', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 20 }), fc.string({ maxLength: 20 }), (a, b) => {
        expect(joined(a, b)).toBe(joined(a.trim(), b.trim()));
      }),
    );
  });
});

describe('Testing the parse and normalization functions', () => {
  it('Tests how the parseRssFeed handles invalid feeds', () => {
    expect(
      parseArticlesRss([], subMonths(new Date(), 3), '019f8b15-d620-73ef-af32-b9008f90049b'),
    ).toStrictEqual([]);

    expect(
      parseArticlesRss(
        [
          {
            title: 'hi',
            link: 'https://example.com',
            pubDate: subDays(new Date(), 3),
          },
        ],
        subMonths(new Date(), 3),
        '019f8b15-d620-73ef-af32-b9008f90049b',
      ),
    ).toMatchObject([
      {
        article: {
          title: 'hi',
        },
      },
    ]);
  });
});
