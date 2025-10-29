import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { getUserPermissions } from "@/utils/get-user-permissions";
import { UnauthorizedError } from "../_errors/unauthorized-error";
import { auth } from "@/http/middlewares/auth";

export async function updateProject(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put('/organizations/:slug/projects/:projectId', {
      schema: {
        tags: ['projects'],
        summary: 'Update a new Project',
        body: z.object({
          name: z.string(),
          description: z.string()
        }),
        params: z.object({
          projectId: z.uuid(),
          slug: z.string()
        }),
        reponse: {
          201: z.object({
            projectId: z.uuid()
          })
        }
      }
    }, async (request, reply) => {
      const { description, name } = request.body
      const { slug, projectId } = request.params

      const userId = await request.getCurrentUserId()

      const { membership, organization } = await request.getUserMembership(slug)

      const { cannot } = getUserPermissions(userId, membership.role)

      if (cannot("update", 'Project')) {
        throw new UnauthorizedError(`You're not allowed to update new project.`)
      }

      await prisma.project.update({
        where: {
          id: projectId,
          organizationId: organization.id,
        },
        data: {
          name,
          description,
        }
      })


      return reply.status(204).send({})
    })
}
