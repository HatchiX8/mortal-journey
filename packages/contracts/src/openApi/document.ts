import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'

import '../modules/system/health.openApi.js'
import { openApiRegistry } from './registry.js'

const openApiGenerator = new OpenApiGeneratorV31(openApiRegistry.definitions)

export const openApiDocument = openApiGenerator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: '凡人・遨遊天地 API',
    version: '0.1.0',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: '本機開發環境',
    },
  ],
  tags: [
    {
      name: 'System',
      description: '系統狀態相關 API。',
    },
  ],
})
