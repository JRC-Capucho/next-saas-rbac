import type { Role } from "@acl/auth"
import { api } from "./api-client"

interface GetMembershipResponse {
  membership: {
    id: string
    role: Role
    organizationId: string
    userId: string
  }
}

export async function getMembership(org: string) {
  return await api
    .get(`organizations/${org}/membership`)
    .json<GetMembershipResponse>()
}
