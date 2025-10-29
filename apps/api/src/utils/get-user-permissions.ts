import { defineAbilityFor, Role, userSchema } from '@acl/auth';

export function getUserPermissions(userId: string, role: Role) {
  const authUser = userSchema.parse({
    id: userId,
    role
  })

  return defineAbilityFor(authUser)
}
