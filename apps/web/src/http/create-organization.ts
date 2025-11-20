import { api } from "@/http/api-client"

interface CreateOranizationRequest {
  name: string
  domain: string | null
  shouldAttachUsersByDomain: boolean
}

type CreateOranizationResponse = void

export async function createOrganization({
  domain,
  name,
  shouldAttachUsersByDomain,
}: CreateOranizationRequest): Promise<CreateOranizationResponse> {
  await api.post("organizations", {
    json: {
      name,
      domain,
      shouldAttachUsersByDomain,
    },
  })
}
