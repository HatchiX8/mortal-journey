import type { z } from 'zod'

import type { HealthResponseSchema } from './health.schema.js'

export type HealthResponseDto = z.infer<typeof HealthResponseSchema>
