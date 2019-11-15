import { Logger, LogLevel } from '@robinlemon/logger';
import ChatClient from 'twitch-chat-client';
import chalk = require('chalk');
import Common from '../Utils/Common';

type QueueMessageTypes = 'Trivia_Start';

interface IQueueRequest {
    Channel: string;
    Message: string;
    Type?: QueueMessageTypes;
}

interface IQueueEntry extends IQueueRequest {
    QueuedAt: number;
    AwaitFn: Promise<void>;
    Resolve: () => void;
}

export abstract class DispatchClient {
    protected abstract MessageClient: MessageQueueDispatcher;
}

export default class MessageQueueDispatcher {
    private Logger = new Logger({ Name: this.constructor.name });

    private TwitchNameColors = [
        'Blue',
        'BlueViolet',
        'CadetBlue',
        'Chocolate',
        'Coral',
        'DodgerBlue',
        'Firebrick',
        'GoldenRod',
        'Green',
        'HotPink',
        'OrangeRed',
        'Red',
        'SeaGreen',
        'SpringGreen',
        'YellowGreen',
    ];
    private CurrentColorIDx = 0;

    private Queue: IQueueEntry[] = [];
    private LastSelfMessage = 0;
    private NextDispatch: NodeJS.Timeout | undefined;

    public constructor(private MessageClient: ChatClient) {}

    public Send = async (Options: IQueueRequest): Promise<void> => {
        const { AwaitFn, Resolve } = this.GenerateDispatchAwaiter();
        this.Queue.push({ ...Options, AwaitFn, QueuedAt: Date.now(), Resolve });
        this.Dispatch();

        return AwaitFn;
    };

    public DetectedSelfMessage = (): void => {
        this.LastSelfMessage = Date.now();
    };

    public GetDispatchQueueLength = (): number => {
        return this.Queue.length;
    };

    private GenerateDispatchAwaiter = (): {
        AwaitFn: Promise<void>;
        Resolve: () => void;
    } => {
        let Resolver!: () => void;
        const AwaitFn = new Promise<void>(Resolve => (Resolver = Resolve));
        return { AwaitFn, Resolve: Resolver };
    };

    private Dispatch = (): void => {
        if (this.Queue.length === 0) return;
        if (this.NextDispatch !== undefined) {
            clearTimeout(this.NextDispatch!);
            this.NextDispatch = undefined;
        }

        const { Channel, Message, Type, Resolve } = this.Queue[0];
        const Delay = (Type === undefined ? 3000 : 5000) - Common.TimeDifference(this.LastSelfMessage);

        if (Message.length > 500) {
            this.Logger.Log(LogLevel.ERROR, `Message Too Long: Received ${Message.length} Characters`);
            this.Queue.shift();
            return;
        }

        if (Delay <= 0) {
            this.LastSelfMessage = Date.now();
            this.Logger.Name = Channel.slice(1);
            this.Logger.Log(`${chalk.magentaBright(`@${this.MessageClient['_credentials'].nick}`)} -> ${Message}`);
            this.MessageClient.say(Channel, Message);
            Resolve();
            this.Queue.shift();

            ++this.CurrentColorIDx;
            if (this.CurrentColorIDx === this.TwitchNameColors.length) this.CurrentColorIDx = 0;
            this.MessageClient.changeColor(this.TwitchNameColors[this.CurrentColorIDx]);
        }

        this.NextDispatch = setTimeout(this.Dispatch, Delay);
    };
}
