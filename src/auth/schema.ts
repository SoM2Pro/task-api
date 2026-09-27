import { z } from "zod";

export const credentialsSchema = z.strictObject({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128),
});
export type Credentials = z.infer<typeof credentialsSchema>;
