import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { UnauthorizedError } from './routes/_errors/unauthorized-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Validation error",
      errors: error.flatten().fieldErrors
    })
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message
    })
  }

  return reply.status(500).send({ message: "Internal server error." })
}
