import Logger, { Levels } from '@robinlemon/logger';
import Chalk from 'chalk';
import ChatClient, { ChatUser } from 'twitch-chat-client';

import MessageQueueDispatcher from './Classes/MessageQueueDispatcher';
import PermissionMultiplexer, { EPermissionStatus } from './Classes/PermissionMultiplexer';
import { PostContext, PreContext } from './Decorators/Command';
import { IMessageHandlerMeta, MessageHandlerType } from './Decorators/MessageHandler';
import Writable from './Decorators/Writable';
import ServiceInjector, { ExtensionCommands, IInjectable, Trivia } from './Integrations/index';
import { ChannelProps } from './test';
import { ClassMethodNames, ClassMethodNamesFilterMethodSignature, FuncParams, RemoveFirstParam } from './Utils/Common';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Channel extends Trivia.Service, ExtensionCommands.Service {}
export class Channel extends ChannelProps implements IInjectable {
    public CommandMap = new Map<string, PostContext>();
    public MessageHandlers: MessageHandlerType[] = [];

    protected ChannelName: string;
    protected Logger = new Logger();
    protected MessageClient: MessageQueueDispatcher;

    private CommandPrefix = '$';
    private DisplayName: string;

    private CommandContext = new Map<string, object>();

    public constructor(ChannelName: string, MessageClient: MessageQueueDispatcher) {
        super();

        this.InjectOverride.bind(this)();

        this.ChannelName = ChannelName;
        this.MessageClient = MessageClient;

        this.DisplayName = ChannelName.slice(1).toLowerCase();
        this.Logger.SetName(this.DisplayName);
        this.InitialiseDecoratorMapping();
    }

    @Writable(true)
    public InjectOverride() {}

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
            for (const Handler of this.MessageHandlers) Handler.bind(this)(User, Message);
        }
    };

    public RegisterCommand(Identifier: string, CommandObj: PostContext<Channel>) {
        const FuncRef = this[CommandObj.Trigger];

        this.Logger.log(
            `[${Chalk.yellowBright(CommandObj.ServiceReference.name)}] Registered Namespace ${Chalk.redBright(
                this.CommandPrefix + Identifier,
            )} -> ${Chalk.yellowBright(CommandObj.ServiceReference.name)}.${Chalk.blueBright(FuncRef.name)}`,
            Levels.SILLY,
        );
        this.CommandMap.set(Identifier, {
            ...CommandObj,
            Trigger: FuncRef,
            Params: [],
        });
    }

    public CreateCommandContext = () => this.CommandContext;

    private InitialiseDecoratorMapping(this: InstanceType<typeof Channel>) {
        const ClassProps: (keyof Channel | 'constructor')[] = Object.getOwnPropertyNames(Channel.prototype) as (keyof Channel | 'constructor')[];
        const WithoutCtor = ClassProps.filter(MethodName => MethodName !== 'constructor');

        /**
         * Commands
         */
        type CommandName = ClassMethodNames<Channel>;
        type CommandPreregisterInfo = {
            MethodName: CommandName;
            Meta: PreContext<Channel>;
        };

        const InfoBlocks = WithoutCtor.map<CommandPreregisterInfo>((MethodName: CommandName) => ({
            MethodName,
            Meta: Reflect.getMetadata('Command::Options', Channel.prototype[MethodName]),
        }));

        InfoBlocks.filter(Block => Block.Meta !== undefined).forEach(Command => {
            this.CommandContext.set(Command.MethodName, Command.Meta.CtxCreator());

            Command.Meta.Identifiers.forEach(Identifier =>
                this.RegisterCommand(Identifier, { ...Command.Meta, CtxRetriever: () => this.CommandContext.get(Command.MethodName) }),
            );
        });

        /**
         * Message Listeners
         */
        type ListenerName = Exclude<ClassMethodNamesFilterMethodSignature<Channel, MessageHandlerType>, 'OnMessage'>;
        const MessageHandlers = WithoutCtor as ListenerName[];

        MessageHandlers.map(MethodName => [MethodName, Reflect.getMetadata('MessageHandler', this[MethodName])])
            .filter(([_MethodName, MetaObj]: [ListenerName, IMessageHandlerMeta]) => MetaObj !== undefined && MetaObj.Valid)
            .forEach(([MethodName, MetaObj]: [ListenerName, IMessageHandlerMeta]) => {
                this.Logger.log(
                    `[${Chalk.yellowBright(MetaObj.ParentClassName)}] Binding MessageHandler ${Chalk.yellowBright(MetaObj.ParentClassName)}.${Chalk.blueBright(
                        MethodName,
                    )}`,
                    Levels.SILLY,
                );

                this.MessageHandlers.push(this[MethodName]);
            });
    }

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
            )
                Command.Trigger.bind({ ...this, ...Command.CtxRetriever() })(User);
        }
    };
}

export default ServiceInjector(Channel, [Trivia.Service, ExtensionCommands.Service]);
