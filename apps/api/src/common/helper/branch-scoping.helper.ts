import type { SelectQueryBuilder } from 'typeorm';
import { UserTypeEnum } from '@repo/contracts';

export interface AuthContext {
  sub?: number;
  id?: number;
  username?: string;
  userType?: UserTypeEnum | string;
  type?: UserTypeEnum | string;
  branchId?: number | null;
  roles?: string[];
}

/**
 * Appends branch scoping WHERE conditions to a TypeORM SelectQueryBuilder query.
 * - Platform SUPER_ADMIN: Unrestricted (can view all branches, or filter by explicit branchId).
 * - Branch Users (ADMIN, CMS, TEACHER, etc.): Strictly scoped to their own branchId.
 */
export function applyBranchScoping<T extends object>(
  query: SelectQueryBuilder<T>,
  alias: string,
  currentUser?: AuthContext,
  explicitBranchId?: number,
): SelectQueryBuilder<T> {
  if (
    currentUser &&
    currentUser.userType !== UserTypeEnum.SUPER_ADMIN &&
    currentUser.userType !== 'SUPER_ADMIN' &&
    currentUser.branchId
  ) {
    query.andWhere(`${alias}.branch_id = :scopedBranchId`, {
      scopedBranchId: currentUser.branchId,
    });
  } else if (explicitBranchId) {
    query.andWhere(`${alias}.branch_id = :explicitBranchId`, {
      explicitBranchId,
    });
  }
  return query;
}

/**
 * Determines the appropriate branchId for newly created entity records.
 * Non-superadmin users are strictly forced to their token's branchId.
 */
export function resolveBranchId(
  currentUser?: AuthContext,
  dtoBranchId?: number | null,
): number | null {
  if (
    currentUser &&
    currentUser.userType !== UserTypeEnum.SUPER_ADMIN &&
    currentUser.userType !== 'SUPER_ADMIN' &&
    currentUser.branchId
  ) {
    return currentUser.branchId;
  }
  return dtoBranchId ?? null;
}
