import { roleSchema } from "@acl/auth"
import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import z from "zod"
import { auth } from "@/http/middlewares/auth"

export async function getMembership(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:slug/membership",
			{
				schema: {
					tags: ["organizations"],
					summary: "Get user membership on organization",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							membership: z.object({
								id: z.uuid(),
								role: roleSchema,
								userId: z.uuid(),
								organizationId: z.uuid(),
							}),
						}),
					},
				},
			},
			async (request) => {
				const { slug } = request.params

				const { membership } = await request.getUserMembership(slug)

				return {
					membership: {
						id: membership.id,
						userId: membership.userId,
						role: membership.role,
						organizationId: membership.organizationId,
					},
				}
			},
		)
}
