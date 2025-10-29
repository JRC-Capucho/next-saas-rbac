import { auth } from "@/http/middlewares/auth";
import { getUserPermissions } from "@/utils/get-user-permissions";
import { organizationSchema } from "@acl/auth";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_errors/unauthorized-error";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function transferOrganization(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch("/organizations/:slug/owner", {
      schema: {
        tags: ['organizations'],
        summary: 'Transfer organization ownership',
        security: [{ bearerAuth: [] }],
        body: z.object({
          transferToUserId: z.uuid()
        }),
        params: z.object({
          slug: z.string()
        }),
        response: {
          204: z.null()
        }
      }
    }, async (request, reply) => {

      const { slug } = request.params

      const { transferToUserId } = request.body

      const userId = await request.getCurrentUserId()

      const { organization, membership } = await request.getUserMembership(slug)

      const authOrganization = organizationSchema.parse(organization)

      const { cannot } = getUserPermissions(userId, membership.role)

      if (cannot('transfer_ownership', authOrganization)) {
        throw new UnauthorizedError(`You're not allowed to transfer this organization ownership.`)
      }

      const transferMembership = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: organization.id,
            userId: transferToUserId
          }
        }
      })

      if (!transferMembership) {
        throw new BadRequestError('Target user is not a member of this organization.')
      }

      await prisma.$transaction([
        prisma.member.update({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: transferToUserId
            }
          },
          data: {
            role: 'ADMIN'
          }
        })
      ])

      prisma.organization.update({
        where: {
          id: organization.id
        },
        data: { ownerId: transferToUserId }
      })

      return reply.status(204).send()
    })

}
