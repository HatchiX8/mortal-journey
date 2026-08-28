import { z } from '../../zod.js'

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
})
