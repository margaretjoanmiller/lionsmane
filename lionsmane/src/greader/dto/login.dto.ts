import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginApiDto = z.object({
  Email: z.email(),
  Passwd: z.string(),
});

export class LoginApiDto extends createZodDto(loginApiDto) {}
