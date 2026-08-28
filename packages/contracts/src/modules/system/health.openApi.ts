import { HealthResponseSchema } from './health.schema.js'
import { openApiRegistry } from '../../openApi/registry.js'

openApiRegistry.register('HealthResponse', HealthResponseSchema)

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['System'],
  summary: '確認 API 服務是否正常運作。',
  responses: {
    200: {
      description: '服務正常運作。',
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
    },
  },
})
