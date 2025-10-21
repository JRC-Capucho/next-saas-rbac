import fastifyCors from '@fastify/cors'
import { fastify } from 'fastify'

import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod'
import { authenticateWithPassword, createAccount, getProfile, requestPasswordRecover, resetPassword } from './routes'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyJwt from '@fastify/jwt'
import { errorHandler } from './error-handler'


const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'ACL Saas',
      description: "Full-stack SaaS app with mult-tenant & RBAC",
      version: "1.0.0"
    },
    servers: [],
  },
  transform: jsonSchemaTransform
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs'
})


app.register(fastifyJwt, {
  secret: 'secret'
})

app.register(fastifyCors)

app.setErrorHandler(errorHandler)

app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(resetPassword)

app.listen({ port: 3333 }).then(() => {
  console.log('HTTP server running')
})
