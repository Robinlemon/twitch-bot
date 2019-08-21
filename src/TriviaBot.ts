import Logger, { Levels } from '@robinlemon/logger';
import Bluebird from 'bluebird';
import * as fs from 'fs-extra';
import TwitchClient from 'twitch';
import ChatClient from 'twitch-chat-client';

import { ITokenResponse, ITokenSerialised } from './Interfaces';
import { SchemaType } from './Schema';

type FilterFunc<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => void ? K : never;
}[keyof T];

type EventParams<K extends FilterFunc<ChatClient>> = Parameters<ChatClient[K]>[0];

export default class TriviaBot {
    private TwitchClient: TwitchClient;
    private ChatClient: ChatClient;
    private TokenInfo: ITokenSerialised;
    private Logger = new Logger(this.constructor.name);
    private Channels: string[] = [];

    public SetChannels = (Channels: string[]) => (this.Channels = Channels);
    public AddChannels = (Channels: string[]) => (this.Channels = [...this.Channels, ...Channels]);

    public Initialise = async (Environment: SchemaType) => {
        this.Logger.log('Loaded Environment');
        this.Channels = Environment.ChannelsList.split(',').map(k => k.trim());

        this.Logger.log('Initialising Twitch API');

        this.Logger.log('Loaded Token Info from FS');
        this.TokenInfo = JSON.parse(await fs.readFile('./tokens.json', 'UTF-8'));

        this.Logger.log('Constructing Twitch Client');
        this.TwitchClient = await TwitchClient.withCredentials(Environment.ClientID, this.TokenInfo.accessToken, undefined, {
            clientSecret: Environment.ClientSecret,
            refreshToken: this.TokenInfo.refreshToken,
            expiry: this.TokenInfo.expiryTimestamp === null ? null : new Date(this.TokenInfo.expiryTimestamp),
            onRefresh: this.RefreshToken,
        });
        this.Logger.log('Created Twitch Client');

        this.Logger.log('Implementing Chat Prototype');
        this.ChatClient = await ChatClient.forTwitchClient(this.TwitchClient);
        this.SetupChat();
    };

    private RefreshToken = async ({ accessToken, refreshToken, expiryDate }: ITokenResponse) => {
        this.Logger.log('Refreshed OAuth Token');

        await fs.writeFile(
            './tokens.json',
            JSON.stringify(
                {
                    accessToken,
                    refreshToken,
                    expiryTimestamp: expiryDate === null ? null : expiryDate.getTime(),
                },
                null,
                4,
            ),
            'UTF-8',
        );

        this.Logger.log('Saved OAuth Token');
    };

    private SetupChat = async () => {
        this.Logger.log('Connecting To Twitch IRC');
        await this.ChatClient.connect();
        this.Logger.log('Connected, Waiting For Registration');
        await this.ChatClient.waitForRegistration();
        this.Logger.log('Successfully Authenticated to Twitch IRC');
        await this.JoinChannels();

        this.SetupEvents();
    };

    private JoinChannels = async () =>
        await Bluebird.map(
            this.Channels,
            async Channel => {
                await this.ChatClient.join(Channel);
                this.Logger.log(`Joined ${Channel}'s channel.`);
            },
            { concurrency: 10 },
        );

    private SetupEvents = () => {
        this.ChatClient.onPrivmsg(this.PrivateMessageHandler);
    };

    private PrivateMessageHandler: EventParams<'onPrivmsg'> = (Channel, User, Message, _Raw) => {
        this.Logger.log(`Message::${User}@${Channel} -> ${Message}`, Levels.DEBUG);
        if (Message === '!ping') this.ChatClient.say(Channel, `@${User} Pong!`);
    };
}
