import { z } from "zod";
export const errorRespSchema = z.object({
  message: z.string().min(3),
});
