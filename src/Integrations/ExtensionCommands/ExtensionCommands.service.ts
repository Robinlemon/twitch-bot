import 'reflect-metadata';

import MessageQueueDispatcher from '../../Classes/MessageQueueDispatcher';
import Command, { CommandType } from '../../Decorators/Command';
import Common from '../../Utils/Common';
import Integration from '../index';

class ExtensionCommands extends Integration {
    public constructor(protected ChannelName: string, protected MessageHandler: MessageQueueDispatcher) {
        super();
    }

    public get Identifier() {
        return this.constructor.name;
    }

    @Command({
        Identifiers: ['jay1cee'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['T OMEGALUL R Y', 'The Sims is a strategy game Kapp']),
        }),
    })
    public Jay1cee: CommandType = (Context, _User) => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        Identifiers: ['strangeguy'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(["That's so silly SillyChamp"]),
        }),
    })
    public StrangeGuy: CommandType = (Context, _User) => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        Identifiers: ['yordann'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(["I'm Gay KappaPride"]),
        }),
    })
    public Yordann: CommandType = (Context, _User) => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        Identifiers: ['besty', 'thebestboy121'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['Yeah I google, deal with it FeelsWeirdMan']),
        }),
    })
    public Besty: CommandType = (Context, _User) => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        Identifiers: ['svas'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['PepeLaugh']),
        }),
    })
    public Svas: CommandType = (Context, _User) => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        Identifiers: ['lucentra'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['WideHardo']),
        }),
    })
    public Lucentra: CommandType = (Context, _User) => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        Identifiers: ['viscose'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['TriHard 7']),
        }),
    })
    public Viscose: CommandType = (Context, _User) => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        Identifiers: ['wideviscose'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['WideHard 7']),
        }),
    })
    public WideViscose: CommandType = (Context, _User) => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };

    @Command({
        Identifiers: ['livid'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator([':)']),
        }),
    })
    public LividVII: CommandType = (Context, _User) => {
        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: (Context.Iterator as IterableIterator<string>).next().value,
        });
    };
}

export default ExtensionCommands;
