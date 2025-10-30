import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { roleSchema } from '@acl/auth'
import { BadRequestError } from '../_errors/bad-request-error'
import { auth } from '@/http/middlewares/auth'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/invites',
      {
        schema: {
          tags: ['invites'],
          summary: 'Get all Invites',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string()
          }),
          response: {
            200: z.object({
              invites:
                z.array(
                  z.object(
                    {
                      id: z.uuid(),
                      email: z.string(),
                      role: roleSchema,
                      createdAt: z.date(),
                      author: z.object({
                        id: z.uuid(),
                        name: z.string().nullable(),
                        avatarUrl: z.string().nullable()
                      }).nullable(),
                      organization: z.object({
                        name: z.string()
                      })
                    }
                  )
                )
            })
          },
        },
      },
      async (request, reply) => {

        const { slug } = request.params

        const userId = await request.getCurrentUserId()

        const { membership, organization } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot("get", 'Invite')) {
          throw new UnauthorizedError(`You're not allowed to get organization invite.`)

        }

        const invites = await prisma.invite.findMany({
          where: { organizationId: organization.id },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            },
            organization: {
              select: {
                name: true
              }
            }
          }
        })

        return reply.status(200).send({
          invites
        })
      },
    )
}
