import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { hasPermission, ResourceEnum } from '@repo/contracts';
import { GradingRule } from './entity/grading-rule.entity.js';
import { StudentScore } from './entity/student-score.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';

export type Subjects = InferSubjects<
  typeof GradingRule | typeof StudentScore
>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, GradingRule);
    can(Actions.manage, StudentScore);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;

    // Examination & Grading Rules
    if (
      hasPermission(perms, Actions.manage, ResourceEnum.EXAMINATION) ||
      hasPermission(perms, Actions.manage, ResourceEnum.ACADEMIC)
    ) {
      can(Actions.manage, GradingRule);
      can(Actions.manage, StudentScore);
    } else {
      if (
        hasPermission(perms, Actions.read, ResourceEnum.EXAMINATION) ||
        hasPermission(perms, Actions.read, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.read, GradingRule);
        can(Actions.read, StudentScore);
      }
      if (
        hasPermission(perms, Actions.create, ResourceEnum.EXAMINATION) ||
        hasPermission(perms, Actions.create, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.create, GradingRule);
        can(Actions.create, StudentScore);
      }
      if (
        hasPermission(perms, Actions.update, ResourceEnum.EXAMINATION) ||
        hasPermission(perms, Actions.update, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.update, GradingRule);
        can(Actions.update, StudentScore);
      }
      if (
        hasPermission(perms, Actions.delete, ResourceEnum.EXAMINATION) ||
        hasPermission(perms, Actions.delete, ResourceEnum.ACADEMIC)
      ) {
        can(Actions.delete, GradingRule);
        can(Actions.delete, StudentScore);
      }
    }
  },
};
