import { ChatUser as ChatUserType } from 'twitch-chat-client';

import PermissionMultiplexer, { EPermissionStatus } from '../PermissionMultiplexer';

describe('PermissionMultiplexer', () => {
    type Badges = 'vip' | 'broadcaster';
    type UserType = 'staff' | 'global_mod' | 'admin' | 'mod' | '';

    interface IUser {
        isSubscriber: boolean;
        isMod: boolean;

        badges: Map<Badges, boolean>;
        userType: UserType;
    }

    const Cases: [string, IUser, EPermissionStatus][] = [
        [
            'Normies',
            {
                badges: new Map<Badges, boolean>(),
                isMod: false,

                isSubscriber: false,
                userType: '',
            },
            EPermissionStatus.Normal,
        ],
        [
            'Subscribers',
            {
                badges: new Map<Badges, boolean>(),
                isMod: false,

                isSubscriber: true,
                userType: '',
            },
            EPermissionStatus.Subscriber,
        ],
        [
            'Moderators',
            {
                badges: new Map<Badges, boolean>(),
                isMod: true,

                isSubscriber: false,
                userType: '',
            },
            EPermissionStatus.Moderator,
        ],
        [
            'Moderator Subscribers',
            {
                badges: new Map<Badges, boolean>(),
                isMod: true,

                isSubscriber: true,
                userType: '',
            },
            EPermissionStatus.Moderator | EPermissionStatus.Subscriber,
        ],
        [
            'VIPs',
            {
                badges: new Map<Badges, boolean>([['vip', true]]),
                isMod: false,

                isSubscriber: false,
                userType: '',
            },
            EPermissionStatus.Vip,
        ],
        [
            'Broadcasters',
            {
                badges: new Map<Badges, boolean>([['broadcaster', true]]),
                isMod: false,

                isSubscriber: false,
                userType: '',
            },
            EPermissionStatus.Admin,
        ],
        [
            'Global Mods',
            {
                badges: new Map<Badges, boolean>(),
                isMod: false,

                isSubscriber: false,
                userType: 'global_mod',
            },
            EPermissionStatus.GlobalMod,
        ],
        [
            'Twitch Staff',
            {
                badges: new Map<Badges, boolean>(),
                isMod: false,

                isSubscriber: false,
                userType: 'staff',
            },
            EPermissionStatus.Staff,
        ],
        [
            'Subscribed Staff',
            {
                badges: new Map<Badges, boolean>(),
                isMod: false,

                isSubscriber: true,
                userType: 'staff',
            },
            EPermissionStatus.Subscriber | EPermissionStatus.Staff,
        ],
    ];

    test.each(Cases)('Should Give %p Correct Perms', (_, ChatUser, PermissionLevel) => {
        expect(PermissionMultiplexer.GetUserPermissions((ChatUser as unknown) as ChatUserType)).toBe(PermissionLevel);
    });
});
