import { ChatUser as _ChatUserType } from 'twitch-chat-client';

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

    const Cases: ([string, IUser, EPermissionStatus])[] = [
        [
            'Normies',
            {
                isSubscriber: false,
                isMod: false,

                badges: new Map<Badges, boolean>(),
                userType: '',
            },
            EPermissionStatus.Normal,
        ],
        [
            'Subscribers',
            {
                isSubscriber: true,
                isMod: false,

                badges: new Map<Badges, boolean>(),
                userType: '',
            },
            EPermissionStatus.Subscriber,
        ],
        [
            'Moderators',
            {
                isSubscriber: false,
                isMod: true,

                badges: new Map<Badges, boolean>(),
                userType: '',
            },
            EPermissionStatus.Moderator,
        ],
        [
            'Moderator Subscribers',
            {
                isSubscriber: true,
                isMod: true,

                badges: new Map<Badges, boolean>(),
                userType: '',
            },
            EPermissionStatus.Moderator | EPermissionStatus.Subscriber,
        ],
        [
            'VIPs',
            {
                isSubscriber: false,
                isMod: false,

                badges: new Map<Badges, boolean>([['vip', true]]),
                userType: '',
            },
            EPermissionStatus.Vip,
        ],
        [
            'Broadcasters',
            {
                isSubscriber: false,
                isMod: false,

                badges: new Map<Badges, boolean>([['broadcaster', true]]),
                userType: '',
            },
            EPermissionStatus.Admin,
        ],
        [
            'Global Mods',
            {
                isSubscriber: false,
                isMod: false,

                badges: new Map<Badges, boolean>(),
                userType: 'global_mod',
            },
            EPermissionStatus.GlobalMod,
        ],
        [
            'Twitch Staff',
            {
                isSubscriber: false,
                isMod: false,

                badges: new Map<Badges, boolean>(),
                userType: 'staff',
            },
            EPermissionStatus.Staff,
        ],
        [
            'Subscribed Staff',
            {
                isSubscriber: true,
                isMod: false,

                badges: new Map<Badges, boolean>(),
                userType: 'staff',
            },
            EPermissionStatus.Subscriber | EPermissionStatus.Staff,
        ],
    ];

    test.each(Cases)('Should Give %p Correct Perms', (_, ChatUser, PermissionLevel) => {
        expect(PermissionMultiplexer.GetUserPermissions(ChatUser as _ChatUserType)).toBe(PermissionLevel);
    });
});
