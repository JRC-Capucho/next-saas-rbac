import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { getUserPermissions } from "@/utils/get-user-permissions";
import { UnauthorizedError } from "../_errors/unauthorized-error";
import { auth } from "@/http/middlewares/auth";

export async function getProjects(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get('/organizations/:slug/projectss/', {
      schema: {
        tags: ['projects'],
        summary: 'Get a Projects',
        params: z.object({
          slug: z.string(),
        }),
        reponse: {
          200: z.object({
            projects: z.array(
              z.object({
                name: z.string(),
                id: z.string(),
                slug: z.string(),
                avatarUrl: z.string().nullable(),
                ownerId: z.string(),
                organizationId: z.string(),
                description: z.string(),
                createdAt: z.date(),
                owner: {
                  name: z.string().nullable(),
                  id: z.string(),
                  avatarUrl: z.string().nullable()
                }
              })
            )
          })
        }
      }
    }, async (request, reply) => {
      const { slug } = request.params

      const userId = await request.getCurrentUserId()

      const { membership, organization } = await request.getUserMembership(slug)

      const { cannot } = getUserPermissions(userId, membership.role)

      if (cannot("get", 'Project')) {
        throw new UnauthorizedError(`You're not allowed to see organization projects`)
      }

      const projects = await prisma.project.findMany({
        where: {
          slug: slug,
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
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            }
          },
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return reply.status(200).send({
        projects
      })
    })
}
