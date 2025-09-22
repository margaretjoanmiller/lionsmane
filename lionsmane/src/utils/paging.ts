import { z } from 'zod';

function safeParseBase64Json(cursor: string) {
  const cursorSchema = z.object({
    id: z.uuid(),
    published: z.string(),
  });
  const parsedCursor = cursorSchema.safeParse(
    JSON.parse(Buffer.from(cursor, 'base64url').toString('ascii')),
  );
  if (!parsedCursor.success) {
    throw new Error('Invalid cursor format');
  }
  return parsedCursor.data;
}

export function parseCursor(cursor: string): {
  published: string;
  id: string;
} {
  try {
    const decoded = safeParseBase64Json(cursor);
    if (!decoded.published || !decoded.id) {
      throw new Error('Invalid cursor format');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid cursor provided', { cause: error });
  }
}

export function createCursor(published: string, id: string): string {
  return Buffer.from(
    JSON.stringify({
      published: published,
      id,
    }),
  ).toString('base64url');
}
