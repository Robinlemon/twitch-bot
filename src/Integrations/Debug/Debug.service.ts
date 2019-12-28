/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Logger, LogLevel } from '@robinlemon/logger';
import Axios from 'axios';
import { getLastCommit } from 'git-last-commit';
import TwitchClient from 'twitch';

import Package from '../../../package.json';
import { MessageQueueDispatcher } from '../../Classes/MessageQueueDispatcher';
import { Command, CommandType } from '../../Decorators/Command';
import { Integration } from '../index';

export class Debug extends Integration {
    private CommitHash = 'Unknown Commit';

    public constructor(
        protected ChannelName: string,
        protected MessageHandler: MessageQueueDispatcher,
        protected Logger: Logger,
        protected Client: TwitchClient,
    ) {
        super();

        getLastCommit((Err, Commit) => {
            if (Err) this.Logger.Log(LogLevel.ERROR, Err);
            else this.CommitHash = Commit.shortHash;
        });
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
            Message: `@${User} -> Pong! FeelsOkayMan 🏓 ppHop 🏓 FeelsOkayMan`,
        });
    };

    @Command({
        Identifiers: ['debug'],
        IncludeProtoNameAsIdentifier: false,
        Moderator: true,
        Subscriber: false,
    })
    public Debug: CommandType = (_Context, User): void => {
        if (User.toLowerCase() !== 'robinlemonz') return;

        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: `@${User} -> ${Object.entries(process.versions)
                .map(([Package, Version]) => `${Package}=${Version}`)
                .join('; ')}`,
        });

        this.MessageHandler.Send({
            Channel: this.ChannelName,
            Message: `@${User} -> Build: v${Package.version} (${this.CommitHash})`,
        });
    };

    @Command({
        Identifiers: ['say'],
        IncludeProtoNameAsIdentifier: false,
        Moderator: true,
        Subscriber: false,
    })
    public Say: CommandType = async (_Context, User, Source): Promise<void> => {
        if (User.toLowerCase() !== 'robinlemonz') return;

        try {
            const { data } = await Axios({ method: 'get', url: Source });
            const Lines = data.split(/\r?\n/g);

            for (const Line of Lines)
                this.MessageHandler.Send({
                    Channel: this.ChannelName,
                    Message: Line,
                    Type: 'No_Delay',
                });
        } catch (Err) {
            this.Logger.Log(LogLevel.ERROR, Err);
            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `Error Fetching Source`,
                Type: 'No_Delay',
            });
        }
    };
}
