import { createError } from "@fastify/error";

export const Duplicate = createError("DUPLICATE", "Entity already exists", 409);
