import { env } from "@acl/env"
import { getCookie } from "cookies-next"
import ky from "ky"

export const api = ky.create({
  prefixUrl: env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        if (typeof window === "undefined") {
          const { cookies } = await import("next/headers")

          const cookieStore = await cookies()

          const token = cookieStore.get("token")?.value
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`)
          }
        } else {
          const token = getCookie("token")

          request.headers.set("Authorization", `Bearer ${token}`)
        }
      },
    ],
  },
})
