import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { BadRequestError } from "../_errors/bad-request-error";

export async function createAccount(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>().post('/users', {
    schema: {
      tags: ['auth'],
      summary: 'Create a new Account',
      body: z.object({
        name: z.string(),
        email: z.string(),
        password: z.string().min(6)
      })
    }
  }, async (request, _reply) => {
    const { email, name, password } = request.body

    const userWithSameEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (userWithSameEmail) {
      throw new BadRequestError("user with same e-mail already exists.")
    }

    const [, domain] = email.split('@')

    const autoJoinOrganization = await prisma.organization.findFirst({
      where: {
        domain,
        shouldAttachUsersByDomain: true
      }
    })

    const passwordHash = await hash(password, 6)

    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        member_on: autoJoinOrganization ? {
          create: {
            organizationId: autoJoinOrganization.id
          }
        } : undefined
      }
    })

  })

}
