import { type Permissions, Actions } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';
import { ResourceEnum } from '@repo/contracts';
import { InstitutionalReport } from './entity/report.entity.js';
import type { AppAuthorizableUser } from '../common/config/casl.config.js';
import { registerCaslPermissions } from '../common/config/casl.helper.js';

export type Subjects = InferSubjects<typeof InstitutionalReport>;

export const permissions: Permissions<
  string,
  Subjects,
  Actions,
  AppAuthorizableUser
> = {
  ADMIN({ can }) {
    can(Actions.manage, InstitutionalReport);
  },

  CMS({ user, can }) {
    const perms = user?.permissions;
    registerCaslPermissions(can, perms, InstitutionalReport, ResourceEnum.REPORT);
  },

  TEACHER({ user, can }) {
    const perms = user?.permissions;
    registerCaslPermissions(can, perms, InstitutionalReport, ResourceEnum.REPORT);
  },

  PORTAL_USER() {
    // No access
  },

  CUSTOMER({ extend }) {
    extend('PORTAL_USER');
  },
};
