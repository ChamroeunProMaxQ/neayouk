import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { ResourceEnum } from '@repo/contracts';
import { GradingRule } from './entity/grading-rule.entity.js';
import { StudentScore } from './entity/student-score.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

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
    registerCaslPermissions(can, perms, GradingRule, ResourceEnum.GRADING_RULE);
    registerCaslPermissions(can, perms, StudentScore, ResourceEnum.EXAMINATION);
  },
};

