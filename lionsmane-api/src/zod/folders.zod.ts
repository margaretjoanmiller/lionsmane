import { z } from "zod";

export const newFolder = z.object({
  name: z.string().min(1).max(100),
  feedIds: z.array(z.uuid()).optional(),
});
