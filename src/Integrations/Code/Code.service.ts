/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Logger } from '@robinlemon/logger';

import { MessageQueueDispatcher } from '../../Classes/MessageQueueDispatcher';
import { Command, CommandType } from '../../Decorators/Command';
import { Integration } from '../index';

export class Code extends Integration {
    private _disabled = false;
    private _count = 0;
    private _usedCode = new Set<string>();

    public constructor(protected ChannelName: string, protected MessageHandler: MessageQueueDispatcher, protected Logger: Logger) {
        super();
    }

    public get Identifier(): string {
        return this.constructor.name;
    }

    @Command({
        Identifiers: ['code'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: false,
    })
    public Code: CommandType = (_Context, User): void => {
        if (this._disabled) return;

        if (this._usedCode.has(User.toLowerCase())) {
            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `@${User} -> You have already redeemed your Fortnite code!`,
            });
            return;
        }

        const Code = Array.from({ length: 4 }, () => this.createRandomString(5)).join('-');

        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: `@${User} -> Your Fortnite code is ${Code}. Please visit https://www.epicgames.com/fortnite/en-US/redeem to redeem your code!`,
        });

        this._usedCode.add(User.toLocaleLowerCase());
        this._count++;

        if (this._count % 10 === 0)
            this.MessageHandler.Send({
                Channel: 'robinlemonz',
                Message: `Jebaited ${this._count} people into creating codes!`,
            });
    };

    @Command({
        Identifiers: ['enablecode'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: false,
    })
    public Enable: CommandType = (_Context, User): void => {
        if (User.toLowerCase() === 'robinlemonz') {
            this._disabled = false;
            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `@${User} -> Enabled code generator.`,
            });
        }
    };

    @Command({
        Identifiers: ['disablecode'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: false,
    })
    public Disable: CommandType = (_Context, User): void => {
        if (User.toLowerCase() === 'robinlemonz') {
            this._disabled = true;
            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `@${User} -> Disabled code generator.`,
            });
        }
    };

    private readonly createRandomString = (length: number): string => {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const charactersLength = characters.length;

        for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * charactersLength));
        return result;
    };
}
