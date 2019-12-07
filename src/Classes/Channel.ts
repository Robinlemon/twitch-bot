import 'reflect-metadata';

import { Logger, LogLevel } from '@robinlemon/logger';
import Chalk from 'chalk';
import ChatClient, { ChatUser } from 'twitch-chat-client';

import { CommandType, ContextTransformer, ICommand, ITransformOptions } from '../Decorators/Command';
import { IMessageHandlerMeta, MessageHandlerType } from '../Decorators/MessageHandler';
import { IntegrationImplementor } from '../Integrations';
import { FuncParams, RemoveFirstParam } from '../Utils/Common';
import { EPermissionStatus, PermissionMultiplexer } from './PermissionMultiplexer';

export class Channel {
    private Logger = new Logger();
    private CommandMap = new Map<string, ICommand>();
    private CommandContext = new Map<string, object>();
    private MessageHandlers: MessageHandlerType[] = [];

    private CommandPrefix = '$';
    private DisplayName: string;

    public constructor(protected ChannelName: string) {
        this.DisplayName = ChannelName.slice(1).toLowerCase();
        this.Logger.Name = this.DisplayName;
    }

    public GetDisplayName = (): string => this.DisplayName;
    public GetLogger = (): Logger => this.Logger;

    public RegisterIntegration<T extends IntegrationImplementor>(Integration: InstanceType<T>): void {
        const InstanceMethods = Object.getOwnPropertyNames(Integration).filter(
            PropName => typeof (Integration as Record<string, unknown>)[PropName] === 'function',
        );

        for (const MethodName of InstanceMethods) {
            const CommandMeta: ITransformOptions | undefined = Reflect.getMetadata('Command::Options', Integration, MethodName);
            if (CommandMeta !== undefined) this.CommandTransformer(Integration, CommandMeta);

            const MessageHandlerMeta: IMessageHandlerMeta | undefined = Reflect.getMetadata('MessageHandler::Options', Integration, MethodName);
            if (MessageHandlerMeta !== undefined) {
                this.Logger.Log(
                    LogLevel.SILLY,
                    `[${Chalk.yellowBright(MessageHandlerMeta.ParentClassName)}] Binding MessageHandler ${Chalk.yellowBright(
                        MessageHandlerMeta.ParentClassName,
                    )}.${Chalk.blueBright(MethodName)}`,
                );

                this.MessageHandlers.push((Integration as Record<string, MessageHandlerType>)[MethodName]);
            }
        }
    }

    public OnMessage: RemoveFirstParam<FuncParams<ChatClient, 'onPrivmsg'>> = (User, Message, Raw) => {
        const ColouredCommands = Message.replace(/^\s*(\$\w+)/g, Message => Chalk.redBright(Message));
        const ColouredNames = ColouredCommands.replace(/(@\S+)/g, Message => Chalk.greenBright(Message));

        let PrintName = `@${User}`;

        if (Raw.userInfo.isSubscriber) PrintName = Chalk.cyanBright(PrintName);
        if (Raw.userInfo.isMod) PrintName = Chalk.greenBright(PrintName);
        if (typeof Raw.userInfo.userType === 'string' && ['global_mod', 'staff'].includes(Raw.userInfo.userType)) PrintName = Chalk.yellowBright(PrintName);
        if ('admin' === Raw.userInfo.userType) PrintName = Chalk.magentaBright(PrintName);

        this.Logger.Log(`${PrintName} -> ${ColouredNames}`);

        const Split = Message.split(' ');
        const IsCommand = Message.startsWith(this.CommandPrefix);
        const Command = Split[0] ? Split[0].substr(this.CommandPrefix.length) : '';
        const Arguments = Split.slice(1);

        if (IsCommand) this.ProcessCommand(User, Command, Raw.userInfo, Arguments);
        else {
            for (const Handler of this.MessageHandlers) Handler(User, Message);
        }
    };

    private CommandTransformer: ContextTransformer = (Instance, Options) => {
        this.CommandContext.set(Options.MethodName, Options.CtxCreator());

        Options.Identifiers.forEach(Identifier => {
            this.Logger.Log(
                LogLevel.SILLY,
                `[${Chalk.yellowBright(Options.IntegrationClass)}] Registered Namespace ${Chalk.redBright(
                    this.CommandPrefix + Identifier,
                )} -> ${Chalk.yellowBright(Options.IntegrationClass)}.${Chalk.blueBright(Options.MethodName)}`,
            );

            this.CommandMap.set(Identifier, {
                ...Options,
                CtxRetriever: () => this.CommandContext.get(Options.MethodName)!,
                Trigger: (Instance as Record<string, CommandType>)[Options.MethodName],
            });
        });
    };

    private ProcessCommand = (User: string, CommandName: string, UserObj: ChatUser, Arguments: string[]): void => {
        const PermissionStatus = PermissionMultiplexer.GetUserPermissions(UserObj);

        if (this.CommandMap.has(CommandName)) {
            const Command = this.CommandMap.get(CommandName)!;

            /* Below subscriber when required */
            if (Command.Subscriber && PermissionStatus < EPermissionStatus.Subscriber) return;

            /* Not a subscriber when provided with strict */
            if (Command.Subscriber && Command.StrictSubscription && !(PermissionStatus & EPermissionStatus.Subscriber)) return;

            /* Not a moderator when required */
            if (Command.Moderator && PermissionStatus < EPermissionStatus.Moderator) return;

            Command.Trigger(Command.CtxRetriever(), User, ...Arguments);
        }
    };
}
