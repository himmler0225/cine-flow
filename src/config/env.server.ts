import { z } from "zod";

const serverEnvSchema = z.object({
  AI_LAYER_URL: z.string().trim().min(1).default("http://localhost:8001"),
  AI_LAYER_KEY: z.string().trim().default(""),
});

/** Server-only secrets and upstream settings; do not import this module from browser code. */
export const serverEnv = Object.freeze(
  serverEnvSchema.parse({
    AI_LAYER_URL: process.env.AI_LAYER_URL,
    AI_LAYER_KEY: process.env.AI_LAYER_KEY,
  }),
);
