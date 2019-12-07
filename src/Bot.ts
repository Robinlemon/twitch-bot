import { Logger } from '@robinlemon/logger';
import Bluebird from 'bluebird';
import * as fs from 'fs-extra';
import Path from 'path';
import TwitchClient, { AccessToken } from 'twitch';
import ChatClient from 'twitch-chat-client';

import { Channel } from './Classes/Channel';
import { MessageQueueDispatcher } from './Classes/MessageQueueDispatcher';
import { MongoConnection } from './Classes/MongoConnection';
import { Integration, IntegrationCtorFn } from './Integrations';
import { ClassType, FuncParams, ITokenSerialised } from './Utils/Common';
import { SchemaType } from './Utils/Schema';

export default class Bot {
    private TwitchClient!: TwitchClient;
    private ChatClient!: ChatClient;
    private MessageClient!: MessageQueueDispatcher;
    private MongoConnection!: MongoConnection;

    private Integrations!: (ClassType<Parameters<IntegrationCtorFn>> & Integration)[];

    private Channels = new Map<string, Channel | null>();
    private TokenPath!: string;
    private TokenInfo!: ITokenSerialised;

    private Logger = new Logger({ Name: this.constructor.name });

    public Initialise = async (Environment: SchemaType): Promise<void> => {
        this.Logger.Log('Loaded Environment');

        this.Integrations = await Integration.LoadIntegrations();
        this.Logger.Log(`Loaded ${this.Integrations.length} Integrations`);

        Environment.ChannelsList.split(',')
            .map(k => k.trim().toLocaleLowerCase())
            .forEach(ChannelName => this.Channels.set(ChannelName, null));

        this.MongoConnection = new MongoConnection(Environment.MongoDBConnectionString);

        this.Logger.Log('Connecting to MongoDB');
        await this.MongoConnection.Initialise();

        this.Logger.Log('Initialising Twitch API');
        this.TokenPath = Path.join(__dirname, '../../', Environment.TokenFile);
        this.TokenInfo = JSON.parse(await fs.readFile(this.TokenPath, 'UTF-8'));
        this.TwitchClient = await TwitchClient.withCredentials(Environment.ClientID, this.TokenInfo.accessToken, undefined, {
            clientSecret: Environment.ClientSecret,
            expiry: this.TokenInfo.expiryTimestamp === null ? null : new Date(this.TokenInfo.expiryTimestamp),
            onRefresh: this.RefreshToken,
            refreshToken: this.TokenInfo.refreshToken,
        });

        this.ChatClient = await ChatClient.forTwitchClient(this.TwitchClient);
        this.MessageClient = new MessageQueueDispatcher(this.ChatClient);

        this.SetupChat();
    };

    private RefreshToken = async ({ accessToken, refreshToken, expiryDate }: AccessToken): Promise<void> => {
        this.Logger.Log('Refreshed OAuth Token');

        await fs.writeFile(
            this.TokenPath,
            JSON.stringify(
                {
                    accessToken,
                    expiryTimestamp: expiryDate === null ? null : expiryDate.getTime(),
                    refreshToken,
                },
                null,
                4,
            ),
            'UTF-8',
        );

        this.Logger.Log('Saved OAuth Token');
    };

    private CreateChannel = (ChannelName: string): Channel => {
        const Instance = new Channel(ChannelName);

        for (const Integration of this.Integrations)
            Instance.RegisterIntegration(new Integration(ChannelName, this.MessageClient, Instance.GetLogger(), this.TwitchClient));
        return Instance;
    };

    private SetupChat = async (): Promise<void> => {
        this.Logger.Log('Connecting To Twitch IRC');
        await this.ChatClient.connect();

        this.Logger.Log('Connected, Waiting For Registration');
        await this.ChatClient.waitForRegistration();

        this.Logger.Log('Successfully Authenticated to Twitch IRC');
        for (const ChannelName of this.Channels.keys()) this.Channels.set(ChannelName, this.CreateChannel(ChannelName));
        await this.JoinChannels();

        this.ChatClient.onPrivmsg(this.PrivateMessageHandler);
    };

    private JoinChannels = async (): Promise<void> => {
        await Bluebird.map(
            this.Channels.keys(),
            async Channel => {
                await this.ChatClient.join(Channel);

                this.Logger.Name = this.Channels.get(Channel)!.GetDisplayName();
                this.Logger.Log('Joined');
                this.Logger.Name = this.constructor.name;
            },
            { concurrency: 10 },
        );
    };

    private PrivateMessageHandler: FuncParams<ChatClient, 'onPrivmsg'> = (Channel, User, Message, Raw) => {
        if (this.Channels.has(Channel)) this.Channels.get(Channel)!.OnMessage(User, Message, Raw);
    };
}
