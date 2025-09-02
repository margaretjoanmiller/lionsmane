import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const CreateFolderSchema = z.object({
  name: z.string().min(1).max(255),
  feedIds: z.array(z.string().uuid()).optional(),
});

export class CreateFolderDto extends createZodDto(CreateFolderSchema) {}
