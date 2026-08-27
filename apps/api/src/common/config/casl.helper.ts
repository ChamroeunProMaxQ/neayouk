import { Actions } from 'nest-casl';
import type { AbilityBuilder, AnyAbility } from '@casl/ability';
import { hasPermission, ResourceEnum, type PermissionDto } from '@repo/contracts';

export type AbilityCan = AbilityBuilder<AnyAbility>['can'];

/**
 * Registers CRUD and manage permissions on a CASL ability builder for a given entity and resource enum
 * using the shared @repo/contracts `hasPermission` resolution.
 */
export function registerCaslPermissions<Subjects extends object>(
  can: AbilityCan,
  perms: PermissionDto[] | undefined,
  entity: Subjects,
  resource: ResourceEnum | string,
): void {
  if (hasPermission(perms, Actions.manage, resource)) {
    can(Actions.manage, entity);
    return;
  }

  if (hasPermission(perms, Actions.read, resource)) {
    can(Actions.read, entity);
  }

  if (hasPermission(perms, Actions.create, resource)) {
    can(Actions.create, entity);
  }

  if (hasPermission(perms, Actions.update, resource)) {
    can(Actions.update, entity);
  }

  if (hasPermission(perms, Actions.delete, resource)) {
    can(Actions.delete, entity);
  }
}
