import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'

import { ApiErrorSchema } from '@mortal-journey/contracts'

export function validateRequestBody<TSchema extends ZodType>(schema: TSchema): RequestHandler {
  return (request, response, next) => {
    const result = schema.safeParse(request.body)

    if (!result.success) {
      response.status(400).json(
        ApiErrorSchema.parse({
          message: '請求資料格式不正確。',
        }),
      )
      return
    }

    request.body = result.data
    next()
  }
}
