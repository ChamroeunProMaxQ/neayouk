import { type Permissions, Actions, type AuthorizableUser } from 'nest-casl';
import { type InferSubjects } from '@casl/ability';

import { User } from './model/user.model.js';
import { UserTypeEnum } from '@repo/shared';

export type Subjects = InferSubjects<typeof User>;

export const permissions: Permissions<
    UserTypeEnum,
    Subjects,
    Actions,
    AuthorizableUser<UserTypeEnum, number>
> = {

    CUSTOMER({ user, can, cannot }) {
        console.log('user in permission:', user);
        can(Actions.read, User, { id: user?.id });
        can(Actions.update, User, { id: user?.id });
        cannot(Actions.read, User);
        cannot(Actions.create, User);
        cannot(Actions.delete, User);
    },

    CMS({ can, cannot }) {
        can(Actions.manage, User);
    },
};