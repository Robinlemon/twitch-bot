import 'reflect-metadata';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Logger } from '@robinlemon/logger';

import MessageQueueDispatcher from '../../Classes/MessageQueueDispatcher';
import Command, { CommandType } from '../../Decorators/Command';
import Common from '../../Utils/Common';
import { Integration } from '../index';

export class ExtensionCommands extends Integration {
    public constructor(protected ChannelName: string, protected MessageHandler: MessageQueueDispatcher, protected Logger: Logger) {
        super();
    }

    public get Identifier(): string {
        return this.constructor.name;
    }

    @Command({
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['T OMEGALUL R Y', 'The Sims is a strategy game Kapp']),
        }),
        Identifiers: ['jay1cee'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Jay1cee: CommandType = Context => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(["That's so silly SillyChamp"]),
        }),
        Identifiers: ['strangeguy'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public StrangeGuy: CommandType = Context => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(["I'm Gay KappaPride"]),
        }),
        Identifiers: ['yordann'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Yordann: CommandType = Context => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['Yeah I google, deal with it FeelsWeirdMan']),
        }),
        Identifiers: ['besty', 'thebestboy121'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Besty: CommandType = Context => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['PepeLaugh']),
        }),
        Identifiers: ['svas'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Svas: CommandType = Context => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['WideHardo']),
        }),
        Identifiers: ['luc', 'lucentra'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Lucentra: CommandType = Context => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['TriHard 7']),
        }),
        Identifiers: ['viscose'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Viscose: CommandType = Context => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['WideHard 7']),
        }),
        Identifiers: ['wideviscose'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public WideViscose: CommandType = Context => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator([':)']),
        }),
        Identifiers: ['livid'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public LividVII: CommandType = Context => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['5Head Idk']),
        }),
        Identifiers: ['amazeful'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Amazeful: CommandType = Context => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        Identifiers: ['pray'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Pray: CommandType = async () => {
        await this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: '👑',
        });
        await this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: 'pokiW ThankEgg',
        });
    };
}
