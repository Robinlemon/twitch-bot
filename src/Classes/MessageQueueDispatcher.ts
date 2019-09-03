import Logger, { Levels } from '@robinlemon/logger';
import ChatClient from 'twitch-chat-client';

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
    private Logger = new Logger(this.constructor.name);

    private Queue: IQueueEntry[] = [];
    private LastSelfMessage: number = 0;
    private NextDispatch!: NodeJS.Timeout;

    public constructor(private MessageClient: ChatClient) {}

    public Send = (Options: IQueueRequest) => {
        const { AwaitFn, Resolve } = this.GenerateDispatchAwaiter();
        this.Queue.push({ ...Options, AwaitFn, Resolve, QueuedAt: Date.now() });
        this.Dispatch();

        return AwaitFn;
    };

    public DetectedSelfMessage = () => (this.LastSelfMessage = Date.now());
    public GetDispatchQueueLength = () => this.Queue.length;

    private GenerateDispatchAwaiter = () => {
        let Resolve: () => void;
        const AwaitFn = new Promise<void>(ResolveFn => (Resolve = ResolveFn));
        return { Resolve, AwaitFn };
    };

    private RatelimitHit = () => {};

    private Dispatch = () => {
        if (this.Queue.length === 0) return;
        if (this.NextDispatch !== undefined) {
            clearTimeout(this.NextDispatch);
            this.NextDispatch = undefined;
        }

        const { Channel, Message, Type, Resolve } = this.Queue[0];
        const Delay = (Type === undefined ? 3000 : 10000) - this.TimeDifference(this.LastSelfMessage);

        if (Message.length > 500) {
            this.Logger.log(`Message Too Long: Received ${Message.length} Characters`, Levels.ERROR);
            this.Queue.shift();
            return;
        }

        if (Delay <= 0) {
            this.LastSelfMessage = Date.now();
            this.Logger.log(`${Channel} -> ${Message}`, Levels.SILLY);
            this.MessageClient.say(Channel, Message);
            Resolve();
            this.Queue.shift();
        }

        this.NextDispatch = setTimeout(this.Dispatch, Delay);
    };

    private TimeDifference = (Timestamp: number) => Date.now() - Timestamp;
}
