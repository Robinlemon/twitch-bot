/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Logger } from '@robinlemon/logger';

import { MessageQueueDispatcher } from '../../Classes/MessageQueueDispatcher';
import { Command, CommandType } from '../../Decorators/Command';
import { Integration } from '../index';

export class Vanish extends Integration {
    public constructor(protected ChannelName: string, protected MessageHandler: MessageQueueDispatcher, protected Logger: Logger) {
        super();
    }

    public get Identifier(): string {
        return this.constructor.name;
    }

    @Command({
        Identifiers: ['vanish'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: false,
    })
    public Vanish: CommandType = (_Context, User): void => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: `/timeout ${User} 1`,
        });
    };
}
