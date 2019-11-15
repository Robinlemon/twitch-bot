import 'reflect-metadata';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Logger, LogLevel } from '@robinlemon/logger';
import { all, create } from 'mathjs';

import { MessageQueueDispatcher } from '../../Classes/MessageQueueDispatcher';
import { Command, CommandType } from '../../Decorators/Command';
import { Integration } from '../index';

const Parser = create(all, {});
const EvalFn = Parser.evaluate;

Parser.import!(
    {
        createUnit() {
            throw new Error('Function createUnit is disabled');
        },
        derivative() {
            throw new Error('Function derivative is disabled');
        },
        evaluate() {
            throw new Error('Function evaluate is disabled');
        },
        import() {
            throw new Error('Function import is disabled');
        },
        parse() {
            throw new Error('Function parse is disabled');
        },
        simplify() {
            throw new Error('Function simplify is disabled');
        },
    },
    { override: true },
);

export class Math extends Integration {
    public constructor(protected ChannelName: string, protected MessageHandler: MessageQueueDispatcher, protected Logger: Logger) {
        super();
    }

    public get Identifier(): string {
        return this.constructor.name;
    }

    @Command({
        Identifiers: ['math', 'eval'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: false,
    })
    public Math: CommandType = async (_Context, User, ...MessageParts): Promise<void> => {
        const FullMessage = MessageParts.join(' ');
        if (FullMessage.length === 0) return;

        try {
            const Result: string | number = EvalFn!(FullMessage);
            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `@${User} -> ${Result}`,
            });
        } catch (Err) {
            this.Logger.Log(LogLevel.DEBUG, Err);
            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `@${User} -> There was an error parsing your expression FeelsBadMan`,
            });
        }
    };
}
