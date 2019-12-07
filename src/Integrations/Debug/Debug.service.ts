/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Logger } from '@robinlemon/logger';

import { MessageQueueDispatcher } from '../../Classes/MessageQueueDispatcher';
import { Command, CommandType } from '../../Decorators/Command';
import { Integration } from '../index';

export class Debug extends Integration {
    public constructor(protected ChannelName: string, protected MessageHandler: MessageQueueDispatcher, protected Logger: Logger) {
        super();
    }

    public get Identifier(): string {
        return this.constructor.name;
    }

    @Command({
        Identifiers: ['ping'],
        IncludeProtoNameAsIdentifier: false,
        Moderator: true,
        Subscriber: false,
    })
    public Ping: CommandType = (_Context, User): void => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: `@${User} -> Pong FeelsOkayMan 🏓 ppHop 🏓 FeelsOkayMan`,
        });
    };
}
