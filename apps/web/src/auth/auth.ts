import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getProfile } from "@/http/get-profile"
import { getMembership } from "@/http/get-membership"
import { defineAbilityFor } from "@acl/auth"

export async function isAuthenticated() {
  return !!(await cookies()).get("token")?.value
}

export async function auth() {
  const cookiesStore = await cookies()

  const token = cookiesStore.get("token")?.value

  if (!token) {
    redirect("/auth/sign-in")
  }

  try {
    const { user } = await getProfile()

    return { user }
  } catch {
    redirect("/api/auth/sign-out")
  }
}

export async function getCurrentOrg() {
  return (await cookies()).get("org")?.value ?? null
}

export async function getCurrentMemebership() {
  const org = await getCurrentOrg()

  if (!org) return null

  const { membership } = await getMembership(org)

  return membership
}

export async function ability() {
  const membership = await getCurrentMemebership()

  if (!membership) return null

  return defineAbilityFor({ id: membership.userId, role: membership.role })
}
