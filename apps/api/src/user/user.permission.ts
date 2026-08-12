import { type Permissions, Actions, type AuthorizableUser } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';

import { User } from './entity/user.entity.js';
import { UserTypeEnum } from '@repo/contracts';

export type Subjects = InferSubjects<typeof User>;

export const permissions: Permissions<
    UserTypeEnum,
    Subjects,
    Actions,
    AuthorizableUser<UserTypeEnum, number>
> = {

    CUSTOMER({ user, can, cannot }) {
        can(Actions.read, User, { id: user?.id });
        can(Actions.update, User, { id: user?.id });
        cannot(Actions.create, User);
        cannot(Actions.delete, User);
    },

    ADMIN({ can }) {
        can(Actions.manage, User);
    },

    CMS({ can }) {
        can(Actions.manage, User);
    },
};