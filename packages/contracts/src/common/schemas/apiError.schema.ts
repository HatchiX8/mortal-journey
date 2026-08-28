import { z } from '../../zod.js'

export const ApiErrorSchema = z.object({
  message: z.string(),
})
