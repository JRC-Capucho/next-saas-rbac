import { AbilityBuilder, createMongoAbility, type CreateAbility, type MongoAbility } from '@casl/ability'
import { permissions } from './permissions.ts'
import type { User } from './models/user.ts'
import { userSubject } from './subjects/user.ts'
import { projectSubject } from './subjects/project.ts'
import { z } from 'zod'
import { organizationSubject } from './subjects/organization.ts'
import { inviteSubject } from './subjects/invite.ts'
import { billingSubject } from './subjects/billing.ts'

export * from './models/organization'
export * from './models/project'
export * from './models/user'
export * from './roles'

const appAbilitiesSchema = z.union([
  projectSubject,
  userSubject,
  organizationSubject,
  inviteSubject,
  billingSubject,
  z.tuple([
    z.literal('manage'),
    z.literal('all')
  ])
]
)

type Appbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<Appbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function') {
    throw new Error(`Permission for role ${user.role} not found.`)
  }

  permissions[user.role](user, builder)

  return builder.build({
    detectSubjectType(subject) {
      return subject.__typename
    },
  })
}
