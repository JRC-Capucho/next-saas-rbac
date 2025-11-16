import { api } from "./api-client"

interface SignUpResquest {
  name: string
  email: string
  password: string
}

type SingupResponse = void

export async function signUp({
  name,
  email,
  password,
}: SignUpResquest): Promise<SingupResponse> {
  await api.post("users", {
    json: {
      email,
      password,
      name,
    },
  })
}
