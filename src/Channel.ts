import Logger, { Levels } from '@robinlemon/logger';
import Chalk from 'chalk';
import ChatClient, { ChatUser } from 'twitch-chat-client';

import MessageQueueDispatcher from './Classes/MessageQueueDispatcher';
import PermissionMultiplexer, { EPermissionStatus } from './Classes/PermissionMultiplexer';
import { ICommand } from './Decorators/Command';
import Writable from './Decorators/Writable';
import ServiceInjector, { IInjectable, Trivia } from './Services/index';
import { ChannelProps } from './test';
import { ClassMethodNames, FuncParams, RemoveFirstParam } from './Utils/Common';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Channel extends Trivia {}
export class Channel extends ChannelProps implements IInjectable {
    public CommandMap = new Map<string, ICommand>();

    protected ChannelName: string;
    protected Logger = new Logger();
    protected MessageClient: MessageQueueDispatcher;

    private CommandPrefix = '$';
    private DisplayName: string;

    public constructor(ChannelName: string, MessageClient: MessageQueueDispatcher) {
        super();

        this.InjectOverride.bind(this)();

        this.ChannelName = ChannelName;
        this.MessageClient = MessageClient;

        this.DisplayName = ChannelName.slice(1).toLowerCase();
        this.Logger.SetName(this.DisplayName);
        this.InitialiseCommands();
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

        this.Logger.log(`${PrintName} -> ${ColouredNames}`, Levels.DEBUG);

        const Split = Message.split(' ');
        const IsCommand = Message.charAt(0) === this.CommandPrefix;
        const Command = Split[0] ? Split[0].substr(this.CommandPrefix.length) : '';

        if (IsCommand) this.ProcessCommand(User, Command, Raw.userInfo);
    };

    private InitialiseCommands = () => {
        const ClassProps: (keyof Channel | 'constructor')[] = Object.getOwnPropertyNames(Channel.prototype) as (keyof Channel | 'constructor')[];

        const WithoutCtor = ClassProps.filter(MethodName => MethodName !== 'constructor') as ClassMethodNames<Channel>[];
        const Options = WithoutCtor.map((MethodName: ClassMethodNames<Channel>) =>
            Reflect.getMetadata('Command::Options', Channel.prototype[MethodName]),
        ) as ICommand<Channel>[];

        Options.filter(Boolean).forEach((Command: ICommand<Channel>) => {
            Command.Identifiers.forEach(Identifier => {
                const FuncRef = this[Command.Trigger];

                this.Logger.log(`Registered '${Identifier}' -> ${FuncRef.name}()`);
                this.CommandMap.set(Identifier, {
                    ...Command,
                    Trigger: FuncRef,
                    Params: [],
                });
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
                this.Logger.log(`${User} Executed ${this.CommandPrefix}${CommandName}`);
                Command.Trigger.bind(this)(User);
            } else this.Logger.log(`${User} Tried to execute ${this.CommandPrefix}${CommandName} but failed due to permissions.`);
        }
    };
}

export default ServiceInjector(Channel, [Trivia]);
