import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/password/recover', {
    schema: {
      body: z.object({
        email: z.email()
      }),
      response: {
        200: z.null()
      }
    },
  }, async (request, reply) => {
    const { email } = request.body

    const userFromEmail = await prisma.user.findUnique({
      where: { email }
    })


    if (!userFromEmail) {
      return reply.status(200)
    }



    const { id: code } = await prisma.token.create({
      data: {
        type: "PASSWORD_RECOVER",
        userId: userFromEmail.id
      }
    })


    return reply.status(200).send()

  })
}
