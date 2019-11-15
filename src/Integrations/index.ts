import { Logger } from '@robinlemon/logger';

import MessageClient from '../Classes/MessageQueueDispatcher';

export default abstract class Integration {
    protected abstract ChannelName: string;
    protected abstract MessageHandler: MessageClient;
    protected abstract Logger: Logger;

    public abstract get Identifier(): string;
}

import ExtensionCommands from './ExtensionCommands';
import Notification from './Notifcation';
import Trivia from './Trivia';

export const IntegrationList = [Trivia, ExtensionCommands, Notification] as const;
export type IntegrationTypeUnion = typeof IntegrationList[number];
