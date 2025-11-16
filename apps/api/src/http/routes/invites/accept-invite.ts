import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"

import { auth } from "@/http/middlewares/auth"
import { BadRequestError } from "@/http/routes/_errors/bad-request-error"
import { prisma } from "@/lib/prisma"

export async function acceptInvite(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/invites/:inviteId",
			{
				schema: {
					tags: ["invites"],
					summary: "Accept an Invite",
					security: [{ bearerAuth: [] }],
					params: z.object({
						inviteId: z.uuid(),
					}),
					response: {
						204: z.null(),
					},
				},
			},
			async (request, reply) => {
				const { inviteId } = request.params

				const userId = await request.getCurrentUserId()

				const invite = await prisma.invite.findUnique({
					where: {
						id: inviteId,
					},
				})

				if (!invite) {
					throw new BadRequestError("Invite not found.")
				}

				const user = await prisma.user.findUnique({
					where: {
						id: userId,
					},
				})

				if (!user) {
					throw new BadRequestError("User not found.")
				}

				if (invite.email !== user.email) {
					throw new BadRequestError("This invite belongs to another user.")
				}

				await prisma.$transaction([
					prisma.member.create({
						data: {
							userId,
							organizationId: invite.organizationId,
							role: invite.role,
						},
					}),

					prisma.invite.delete({
						where: { id: inviteId },
					}),
				])

				return reply.status(204).send()
			},
		)
}
