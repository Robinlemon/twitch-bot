import Logger from '@robinlemon/logger';
import Bluebird from 'bluebird';
import * as fs from 'fs-extra';
import Path from 'path';
import TwitchClient from 'twitch';
import ChatClient from 'twitch-chat-client';

import Channel from './Classes/Channel';
import MessageQueueDispatcher from './Classes/MessageQueueDispatcher';
import MongoConnection from './Classes/MongoConnection';
import { IntegrationList } from './Integrations';
import { FuncParams, ITokenResponse, ITokenSerialised } from './Utils/Common';
import { SchemaType } from './Utils/Schema';

export default class Bot {
    private TwitchClient: TwitchClient;
    private ChatClient: ChatClient;
    private MessageClient: MessageQueueDispatcher;
    private MongoConnection: MongoConnection;

    private Channels = new Map<string, Channel>();
    private TokenPath: string;
    private TokenInfo: ITokenSerialised;

    private Logger = new Logger(this.constructor.name);

    public Initialise = async (Environment: SchemaType) => {
        this.Logger.log('Loaded Environment');

        Environment.ChannelsList.split(',')
            .map(k => k.trim().toLocaleLowerCase())
            .forEach(ChannelName => this.Channels.set(ChannelName, null));

        this.MongoConnection = new MongoConnection(Environment.MongoDBConnectionString);

        this.Logger.log('Connecting to MongoDB');
        await this.MongoConnection.Initialise();

        this.Logger.log('Initialising Twitch API');
        this.TokenPath = Path.join(__dirname, '..', Environment.TokenFile);
        this.TokenInfo = JSON.parse(await fs.readFile(this.TokenPath, 'UTF-8'));
        this.TwitchClient = await TwitchClient.withCredentials(Environment.ClientID, this.TokenInfo.accessToken, undefined, {
            clientSecret: Environment.ClientSecret,
            refreshToken: this.TokenInfo.refreshToken,
            expiry: this.TokenInfo.expiryTimestamp === null ? null : new Date(this.TokenInfo.expiryTimestamp),
            onRefresh: this.RefreshToken,
        });

        this.ChatClient = await ChatClient.forTwitchClient(this.TwitchClient);
        this.MessageClient = new MessageQueueDispatcher(this.ChatClient);

        this.SetupChat();
    };

    private RefreshToken = async ({ accessToken, refreshToken, expiryDate }: ITokenResponse) => {
        this.Logger.log('Refreshed OAuth Token');

        await fs.writeFile(
            this.TokenPath,
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

    private CreateChannel = (ChannelName: string) => {
        const Instance = new Channel(ChannelName);

        for (const Integration of IntegrationList) Instance.RegisterIntegration(new Integration(ChannelName, this.MessageClient, Instance.GetLogger()));
        return Instance;
    };

    private SetupChat = async () => {
        this.Logger.log('Connecting To Twitch IRC');
        await this.ChatClient.connect();

        this.Logger.log('Connected, Waiting For Registration');
        await this.ChatClient.waitForRegistration();

        this.Logger.log('Successfully Authenticated to Twitch IRC');
        for (const ChannelName of this.Channels.keys()) this.Channels.set(ChannelName, this.CreateChannel(ChannelName));
        await this.JoinChannels();

        this.ChatClient.onPrivmsg(this.PrivateMessageHandler);
    };

    private JoinChannels = async () =>
        await Bluebird.map(
            this.Channels.keys(),
            async Channel => {
                await this.ChatClient.join(Channel);

                this.Logger.SetName(this.Channels.get(Channel).GetDisplayName());
                this.Logger.log('Joined');
                this.Logger.SetName(this.constructor.name);
            },
            { concurrency: 10 },
        );

    private PrivateMessageHandler: FuncParams<ChatClient, 'onPrivmsg'> = (Channel, User, Message, Raw) => {
        if (this.Channels.has(Channel) === true) this.Channels.get(Channel).OnMessage(User, Message, Raw);
    };
}
