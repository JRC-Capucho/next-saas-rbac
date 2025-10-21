import fastifyCors from '@fastify/cors'
import { fastify } from 'fastify'
import { env } from '@acl/env'

import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod'
import { authenticateWithGithub, authenticateWithPassword, createAccount, createOrganization, getMembership, getOrganization, getOrganizations, getProfile, requestPasswordRecover, resetPassword } from './routes'
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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  transform: jsonSchemaTransform
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs'
})


app.register(fastifyJwt, {
  secret: env.JWT_SECRET
})

app.register(fastifyCors)

app.setErrorHandler(errorHandler)

app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(resetPassword)
app.register(authenticateWithGithub)

app.register(createOrganization)
app.register(getMembership)
app.register(getOrganization)
app.register(getOrganizations)

app.listen({ port: 3333 }).then(() => {
  console.log('HTTP server running')
})
