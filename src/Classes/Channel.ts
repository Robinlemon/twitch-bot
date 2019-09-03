import 'reflect-metadata';

import Logger, { Levels } from '@robinlemon/logger';
import Chalk from 'chalk';
import ChatClient, { ChatUser } from 'twitch-chat-client';

import { CommandType, ContextTransformer, ICommand, ITransformOptions } from '../Decorators/Command';
import { IMessageHandlerMeta, MessageHandlerType } from '../Decorators/MessageHandler';
// eslint-disable-next-line
import { IntegrationList } from '../Integrations';
import { FuncParams, RemoveFirstParam } from '../Utils/Common';
import PermissionMultiplexer, { EPermissionStatus } from './PermissionMultiplexer';

export default class Channel {
    private Logger = new Logger();
    private CommandMap = new Map<string, ICommand>();
    private CommandContext = new Map<string, object>();
    private MessageHandlers: MessageHandlerType[] = [];

    private CommandPrefix = '$';
    private DisplayName: string;

    public constructor(protected ChannelName: string) {
        this.DisplayName = ChannelName.slice(1).toLowerCase();
        this.Logger.SetName(this.DisplayName);
    }

    public GetDisplayName = (): string => this.DisplayName;
    public GetLogger = (): Logger => this.Logger;

    public RegisterIntegration<T extends (typeof IntegrationList)[number]>(Integration: InstanceType<T>) {
        const InstanceMethods = Object.getOwnPropertyNames(Integration).filter(
            PropName => typeof (Integration as Record<string, unknown>)[PropName] === 'function',
        );

        for (const MethodName of InstanceMethods) {
            const CommandMeta: ITransformOptions | undefined = Reflect.getMetadata('Command::Options', Integration, MethodName);
            if (CommandMeta !== undefined) this.CommandTransformer(Integration, CommandMeta);

            const MessageHandlerMeta: IMessageHandlerMeta | undefined = Reflect.getMetadata('MessageHandler::Options', Integration, MethodName);
            if (MessageHandlerMeta !== undefined) {
                this.Logger.log(
                    `[${Chalk.yellowBright(MessageHandlerMeta.ParentClassName)}] Binding MessageHandler ${Chalk.yellowBright(
                        MessageHandlerMeta.ParentClassName,
                    )}.${Chalk.blueBright(MethodName)}`,
                    Levels.SILLY,
                );

                this.MessageHandlers.push((Integration as Record<string, MessageHandlerType>)[MethodName]);
            }
        }
    }

    public OnMessage: RemoveFirstParam<FuncParams<ChatClient, 'onPrivmsg'>> = (User, Message, Raw) => {
        const ColouredCommands = Message.replace(/^\s*(\$\w+)/g, Message => Chalk.redBright(Message));
        const ColouredNames = ColouredCommands.replace(/(\@[^\s]+)/g, Message => Chalk.greenBright(Message));

        let PrintName = `@${User}`;

        if (Raw.userInfo.isSubscriber) PrintName = Chalk.cyanBright(PrintName);
        if (Raw.userInfo.isMod) PrintName = Chalk.greenBright(PrintName);
        if (['global_mod', 'staff'].includes(Raw.userInfo.userType)) PrintName = Chalk.yellowBright(PrintName);
        if ('admin' === Raw.userInfo.userType) PrintName = Chalk.magentaBright(PrintName);

        this.Logger.log(`${PrintName} -> ${ColouredNames}`);

        const Split = Message.split(' ');
        const IsCommand = Message.charAt(0) === this.CommandPrefix;
        const Command = Split[0] ? Split[0].substr(this.CommandPrefix.length) : '';

        if (IsCommand) this.ProcessCommand(User, Command, Raw.userInfo);
        else {
            for (const Handler of this.MessageHandlers) Handler(User, Message);
        }
    };

    private CommandTransformer: ContextTransformer = (Instance, Options) => {
        this.CommandContext.set(Options.MethodName, Options.CtxCreator());

        Options.Identifiers.forEach(Identifier => {
            this.Logger.log(
                `[${Chalk.yellowBright(Options.IntegrationClass)}] Registered Namespace ${Chalk.redBright(
                    this.CommandPrefix + Identifier,
                )} -> ${Chalk.yellowBright(Options.IntegrationClass)}.${Chalk.blueBright(Options.MethodName)}`,
                Levels.SILLY,
            );

            this.CommandMap.set(Identifier, {
                ...Options,
                Trigger: (Instance as Record<string, CommandType>)[Options.MethodName],
                CtxRetriever: () => this.CommandContext.get(Options.MethodName),
            });
        });
    };

    private ProcessCommand = (User: string, CommandName: string, UserObj: ChatUser) => {
        const PermissionStatus = PermissionMultiplexer.GetUserPermissions(UserObj);

        if (this.CommandMap.has(CommandName)) {
            const Command = this.CommandMap.get(CommandName);

            // https://i.imgur.com/EnJ8v7L.png
            if (
                (Command.StrictSubscription &&
                    ((Command.Subscriber && PermissionStatus & EPermissionStatus.Subscriber) ||
                        (Command.Moderator && PermissionStatus >= EPermissionStatus.Moderator))) ||
                (Command.StrictSubscription === false && Command.Subscriber && PermissionStatus >= EPermissionStatus.Subscriber)
            ) {
                Command.Trigger(Command.CtxRetriever(), User);
            }
        }
    };
}
