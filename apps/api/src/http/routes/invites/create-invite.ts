import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'
import { roleSchema } from '@acl/auth'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/invite',
      {
        schema: {
          tags: ['invites'],
          summary: 'Create a new Invite',
          security: [{ bearerAuth: [] }],
          body: z.object({
            email: z.email(),
            role: roleSchema
          }),
          params: z.object({
            slug: z.string()
          }),
          response: {
            201: z.object({
              InviteId: z.uuid()
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()

        const { membership, organization } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Invite')) {
          throw new UnauthorizedError(`You're not allowed to create new invites.`)
        }

        const { email, role } = request.body

        const [, domain] = email.split('@')

        if (organization.shouldAttachUsersByDomain && organization.domain === domain) {
          throw new BadRequestError(`Users with ${domain} domain will join your organization automatically on login.`)
        }

        const inviteWithSameEmail = await prisma.invite.findUnique({
          where: {
            email_organizationId: {
              email, organizationId: organization.id
            }
          }
        })

        if (inviteWithSameEmail) {
          throw new BadRequestError('Another invite with same e-mail already exists.')
        }

        const memberWithSameEmail = await prisma.member.findFirst({
          where: {
            organizationId: organization.id,
            user: { email }
          },
        })

        if (memberWithSameEmail) {
          throw new BadRequestError('A member with this e-mail already belongs to your organization.')
        }

        const invite = await prisma.invite.create({
          data: {
            organizationId: organization.id,
            email, authorId: userId,
            role
          }
        })

        return reply.status(201).send({
          InviteId: invite.id
        })

      },
    )
}
