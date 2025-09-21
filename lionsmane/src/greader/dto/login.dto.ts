import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginApiDto = z.object({
  email: z.email(),
  password: z.string(),
});

export class LoginApiDto extends createZodDto(loginApiDto) { }
