import 'reflect-metadata';

import Command from '../../Decorators/Command';
import { ChannelProps } from '../../test';
import Common from '../../Utils/Common';

class ExtensionCommands extends ChannelProps {
    public constructor() {
        super();
    }

    @Command({
        Identifiers: ['jay1cee'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['T OMEGALUL R Y', 'The Sims is a strategy game Kapp']),
        }),
    })
    public async Jay1cee(this: ExtensionCommands & { Iterator: IterableIterator<string> }): Promise<void> {
        this.MessageClient.Send({
            Channel: this.ChannelName,
            Message: this.Iterator.next().value,
        });
    }

    @Command({
        Identifiers: ['strangeguy'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(["That's so silly SillyChamp"]),
        }),
    })
    public async StrangeGuy(this: ExtensionCommands & { Iterator: IterableIterator<string> }): Promise<void> {
        this.MessageClient.Send({
            Channel: this.ChannelName,
            Message: this.Iterator.next().value,
        });
    }

    @Command({
        Identifiers: ['yordann'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(["I'm Gay KappaPride"]),
        }),
    })
    public async Yordann(this: ExtensionCommands & { Iterator: IterableIterator<string> }): Promise<void> {
        this.MessageClient.Send({
            Channel: this.ChannelName,
            Message: this.Iterator.next().value,
        });
    }

    @Command({
        Identifiers: ['besty', 'thebestboy121'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['Yeah I google, deal with it FeelsWeirdMan']),
        }),
    })
    public async Besty(this: ExtensionCommands & { Iterator: IterableIterator<string> }): Promise<void> {
        this.MessageClient.Send({
            Channel: this.ChannelName,
            Message: this.Iterator.next().value,
        });
    }

    @Command({
        Identifiers: ['svas'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['PepeLaugh']),
        }),
    })
    public async Svas(this: ExtensionCommands & { Iterator: IterableIterator<string> }): Promise<void> {
        this.MessageClient.Send({
            Channel: this.ChannelName,
            Message: this.Iterator.next().value,
        });
    }

    @Command({
        Identifiers: ['lucentra'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
        CtxCreator: () => ({
            Iterator: Common.CreateNonRepeatingRandomArrayIterator(['WideHardo']),
        }),
    })
    public async Lucentra(this: ExtensionCommands & { Iterator: IterableIterator<string> }): Promise<void> {
        this.MessageClient.Send({
            Channel: this.ChannelName,
            Message: this.Iterator.next().value,
        });
    }
}

export default ExtensionCommands;
