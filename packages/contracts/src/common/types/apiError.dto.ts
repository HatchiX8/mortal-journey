import type { z } from 'zod'

import type { ApiErrorSchema } from '../schemas/apiError.schema.js'

export type ApiErrorDto = z.infer<typeof ApiErrorSchema>
