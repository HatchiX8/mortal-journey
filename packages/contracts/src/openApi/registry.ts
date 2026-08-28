import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { ApiErrorSchema } from '../common/schemas/apiError.schema.js'

export const openApiRegistry = new OpenAPIRegistry()

openApiRegistry.register('ApiError', ApiErrorSchema)
