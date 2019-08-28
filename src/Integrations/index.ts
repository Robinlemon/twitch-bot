import MessageClient from '../Classes/MessageQueueDispatcher';

export default abstract class Integration {
    protected abstract ChannelName: string;
    protected abstract MessageHandler: MessageClient;

    public abstract get Identifier(): string;
}

//import BasicCommandMapping from './BasicCommandMapping';
import ExtensionCommands from './ExtensionCommands';
import Trivia from './Trivia';

export const IntegrationList = [Trivia, ExtensionCommands];
export type IntegrationTypeUnion = (typeof IntegrationList)[number];
