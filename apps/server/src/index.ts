import 'dotenv/config'
import { HealthResponseSchema } from '@mortal-journey/contracts'
import { openApiDocument } from '@mortal-journey/contracts/openApi'
import cors from 'cors'
import express from 'express'
import swaggerUi from 'swagger-ui-express'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(cors())
app.use(express.json())

app.get('/api-docs.json', (_request, response) => {
  response.json(openApiDocument)
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))

app.get('/api/health', (_request, response) => {
  response.json(HealthResponseSchema.parse({ status: 'ok' }))
})

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})
