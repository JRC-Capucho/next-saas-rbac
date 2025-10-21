import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'

export async function getProfile(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).get('/profile', {
    schema: {
      tags: ['auth'],
      summary: 'Get authenticate user profile',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          user: z.object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
            avatarUrl: z.string().nullable()
          })
        })
      },
    }
  }, async (request, reply) => {
    const userId = await request.getCurrentUserId()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    return reply.status(200).send({ user })

  })
}
