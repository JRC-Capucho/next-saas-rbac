import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { getUserPermissions } from "@/utils/get-user-permissions";
import { UnauthorizedError } from "../_errors/unauthorized-error";
import { BadRequestError } from "../_errors/bad-request-error";
import { projectSchema } from "@acl/auth";
import { auth } from "@/http/middlewares/auth";

export async function deleteProject(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete('/organizations/:slug/projects/:projectId', {
      schema: {
        tags: ['projects'],
        summary: 'Delete a new Project',
        params: z.object({
          slug: z.string(),
          projectId: z.uuid()
        }),
        reponse: {
          204: z.null()
        }
      }
    }, async (request, reply) => {
      const { slug, projectId } = request.params

      const userId = await request.getCurrentUserId()

      const { membership, organization } = await request.getUserMembership(slug)

      const project = await prisma.project.findUnique({
        where: {
          id: projectId,
          organizationId: organization.id
        },
      })

      if (!project) {
        throw new BadRequestError('')
      }

      const authProject = projectSchema.parse(project)

      const { cannot } = getUserPermissions(userId, membership.role)

      if (cannot("delete", authProject)) {
        throw new UnauthorizedError(`You're not allowed to delete new project.`)
      }

      await prisma.project.delete({
        where: {
          id: projectId
        }
      })


      return reply.status(204).send({})
    })
}
