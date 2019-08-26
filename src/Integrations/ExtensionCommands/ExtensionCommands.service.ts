import 'reflect-metadata';

import Command from '../../Decorators/Command';
import { ChannelProps } from '../../test';

class ExtensionCommands extends ChannelProps {
    public constructor() {
        super();
    }

    @Command({
        Identifiers: ['jay1cee'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public async Jay1cee(): Promise<void> {
        this.MessageClient.Send({
            Channel: this.ChannelName,
            Message: `T OMEGALUL R Y`,
        });
    }

    @Command({
        Identifiers: ['strangeguy'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public async StrangeGuy(): Promise<void> {
        this.MessageClient.Send({
            Channel: this.ChannelName,
            Message: `That's so silly SillyChamp`,
        });
    }
}

export default ExtensionCommands;
