import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { getUserPermissions } from "@/utils/get-user-permissions";
import { UnauthorizedError } from "../_errors/unauthorized-error";
import { createSlug } from "@/utils/create-slug";
import { auth } from "@/http/middlewares/auth";

export async function createProject(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post('/organizations/:slug/projects', {
      schema: {
        tags: ['projects'],
        summary: 'Create a new Project',
        body: z.object({
          name: z.string(),
          description: z.string()
        }),
        params: z.object({
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
      const { slug } = request.params

      const userId = await request.getCurrentUserId()

      const { membership, organization } = await request.getUserMembership(slug)

      const { cannot } = getUserPermissions(userId, membership.role)

      if (cannot("create", 'Project')) {
        throw new UnauthorizedError(`You're not allowed to create new project.`)
      }

      const project = await prisma.project.create({
        data: {
          name,
          description,
          slug: createSlug(name),
          organizationId: organization.id,
          ownerId: userId
        }
      })


      return reply.status(201).send({
        projectId: project.id
      })
    })
}
