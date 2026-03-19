import { fc, test } from '@fast-check/vitest';
import { describe, expect, it } from 'vitest';
import { createCursor, parseCursor } from '../src/utils/paging';

describe('paging utils', () => {
  describe('roundtrip', () => {
    it('should correctly parse a generated cursor back to its original values', () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date('1970-01-01T00:00:00.000Z'),
            max: new Date('3000-01-01T00:00:00.000Z'),
          }),
          fc.uuid(),
          (published, id) => {
            const cursor = createCursor(published, id);
            const parsed = parseCursor(cursor);

            expect(parsed.id).toBe(id);
            expect(parsed.published.getTime()).toBe(published.getTime());
          },
        ),
      );
    });
  });

  describe('parseCursor - error handling', () => {
    it('throws on invalid base64 string', () => {
      expect(() => parseCursor('invalid-base64-%$#')).toThrow(
        'Invalid cursor provided',
      );
    });

    it('throws on valid base64 but invalid JSON', () => {
      const invalidJson = Buffer.from('not really json').toString('base64url');
      expect(() => parseCursor(invalidJson)).toThrow('Invalid cursor provided');
    });

    it('throws when payload is missing required keys', () => {
      const payload = Buffer.from(
        JSON.stringify({ someKey: 'value' }),
      ).toString('base64url');
      expect(() => parseCursor(payload)).toThrow('Invalid cursor provided');
    });

    it('throws when id is not a valid UUID', () => {
      const payload = Buffer.from(
        JSON.stringify({
          id: 'not-a-uuid',
          published: new Date().toISOString(),
        }),
      ).toString('base64url');
      expect(() => parseCursor(payload)).toThrow('Invalid cursor provided');
    });

    it('throws when published is not a valid ISO datetime', () => {
      const payload = Buffer.from(
        JSON.stringify({
          id: '123e4567-e89b-12d3-a456-426614174000',
          published: 'not-a-date',
        }),
      ).toString('base64url');
      expect(() => parseCursor(payload)).toThrow('Invalid cursor provided');
    });
  });
});
