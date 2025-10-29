import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { getUserPermissions } from "@/utils/get-user-permissions";
import { UnauthorizedError } from "../_errors/unauthorized-error";
import { auth } from "@/http/middlewares/auth";
import { BadRequestError } from "../_errors/bad-request-error";
export async function getProject(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get('/organizations/:orgSlug/projects/:projectSlug', {
      schema: {
        tags: ['projects'],
        summary: 'Get a Project',
        params: z.object({
          orgSlug: z.string(),
          projectSlug: z.uuid()
        }),
        reponse: {
          200: z.object({
            project: {
              name: z.string(),
              id: z.string(),
              slug: z.string(),
              avatarUrl: z.string().nullable(),
              ownerId: z.string(),
              organizationId: z.string(),
              description: z.string(),
              owner: {
                name: z.string().nullable(),
                id: z.string(),
                avatarUrl: z.string().nullable()
              }
            }
          })
        }
      }
    }, async (request, reply) => {
      const { orgSlug, projectSlug } = request.params

      const userId = await request.getCurrentUserId()

      const { membership, organization } = await request.getUserMembership(orgSlug)

      const { cannot } = getUserPermissions(userId, membership.role)

      if (cannot("get", 'Project')) {
        throw new UnauthorizedError(`You're not allowed to get a project.`)
      }

      const project = await prisma.project.findUnique({
        where: {
          slug: projectSlug,
          organizationId: organization.id
        },
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          ownerId: true,
          avatarUrl: true,
          organizationId: true,
          owner: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            }
          },
        }
      })

      if (!project) {
        throw new BadRequestError('Project not found.')
      }


      return reply.status(200).send({
        project
      })
    })
}
