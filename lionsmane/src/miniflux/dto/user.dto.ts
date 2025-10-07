import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  is_admin: z.boolean(),
  theme: z.string(),
  language: z.string(),
  timezone: z.string(),
  entry_sorting_direction: z.string(),
  stylesheet: z.string(),
  google_id: z.string(),
  openid_connect_id: z.string(),
  entries_per_page: z.number(),
  keyboard_shortcuts: z.boolean(),
  show_reading_time: z.boolean(),
  entry_swipe: z.boolean(),
  last_login_at: z.string(),
});

export type UserSessionMini = z.infer<typeof userSchema>;

export class UserSchemaDto extends createZodDto(userSchema) {}
