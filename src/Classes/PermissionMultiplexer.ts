import { ChatUser } from 'twitch-chat-client';

export enum EPermissionStatus {
    Normal = 0,
    Subscriber = 1 << 0,
    Vip = 1 << 1,
    Moderator = 1 << 2,
    Admin = 1 << 3,
    GlobalMod = 1 << 4,
    Staff = 1 << 5,
}

export default class PermissionMultiplexer {
    public static GetUserPermissions = (User: ChatUser) => {
        let PermissionLevel = EPermissionStatus.Normal;

        /* Subscriber */
        if (User.isSubscriber) PermissionLevel |= EPermissionStatus.Subscriber;

        /* Vip */
        if (User.badges.has('vip')) PermissionLevel |= EPermissionStatus.Vip;

        /* Moderator */
        if (User.isMod || User.userType === 'mod') PermissionLevel |= EPermissionStatus.Moderator;

        /* Admin (Broadcaster) */
        if (User.badges.has('broadcaster') || User.userType === 'admin') PermissionLevel |= EPermissionStatus.Admin;

        /* Global Mod */
        if (User.userType === 'global_mod') PermissionLevel |= EPermissionStatus.GlobalMod;

        /* Staff */
        if (User.userType === 'staff') PermissionLevel |= EPermissionStatus.Staff;

        return PermissionLevel;
    };
}
