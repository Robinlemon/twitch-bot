import Logger from '@robinlemon/logger';
import Bluebird from 'bluebird';
import * as fs from 'fs-extra';
import TwitchClient from 'twitch';
import ChatClient from 'twitch-chat-client';

import { Channel } from './Channel';
import MessageQueueDispatcher from './Classes/MessageQueueDispatcher';
import { FuncParams, ITokenResponse, ITokenSerialised } from './Utils/Common';
import { SchemaType } from './Utils/Schema';

export default class TriviaBot {
    private TwitchClient: TwitchClient;
    private ChatClient: ChatClient;
    private Messager: MessageQueueDispatcher;

    private Channels = new Map<string, Channel>();
    private TokenInfo: ITokenSerialised;

    private Logger = new Logger(this.constructor.name);

    public Initialise = async (Environment: SchemaType) => {
        this.Logger.log('Loaded Environment');

        Environment.ChannelsList.split(',')
            .map(k => k.trim().toLocaleLowerCase())
            .forEach(ChannelName => this.Channels.set(ChannelName, null));

        this.Logger.log('Initialising Twitch API');
        this.TokenInfo = JSON.parse(await fs.readFile('./tokens.json', 'UTF-8'));
        this.TwitchClient = await TwitchClient.withCredentials(Environment.ClientID, this.TokenInfo.accessToken, undefined, {
            clientSecret: Environment.ClientSecret,
            refreshToken: this.TokenInfo.refreshToken,
            expiry: this.TokenInfo.expiryTimestamp === null ? null : new Date(this.TokenInfo.expiryTimestamp),
            onRefresh: this.RefreshToken,
        });

        this.ChatClient = await ChatClient.forTwitchClient(this.TwitchClient);
        this.Messager = new MessageQueueDispatcher(this.ChatClient);

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
        for (const ChannelName of this.Channels.keys()) this.Channels.set(ChannelName, new Channel(ChannelName, this.Messager));
        await this.JoinChannels();

        this.ChatClient.onPrivmsg(this.PrivateMessageHandler);
    };

    private JoinChannels = async () =>
        await Bluebird.map(
            this.Channels.keys(),
            async Channel => {
                await this.ChatClient.join(Channel);

                this.Logger.SetName(Channel.slice(1).toLowerCase());
                this.Logger.log('Joined');
                this.Logger.SetName(this.constructor.name);
            },
            { concurrency: 10 },
        );

    private PrivateMessageHandler: FuncParams<ChatClient, 'onPrivmsg'> = async (Channel, User, Message, _Raw) => {
        if (this.Channels.has(Channel) === false) return;
        else this.Channels.get(Channel).OnMessage(User, Message, _Raw);
    };
}
