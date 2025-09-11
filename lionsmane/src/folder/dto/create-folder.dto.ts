import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateFolderSchema = z.object({
  name: z.string().min(1).max(255),
  feedIds: z.array(z.uuid()).optional(),
});

export class CreateFolderDto extends createZodDto(CreateFolderSchema) {}
