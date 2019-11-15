import 'reflect-metadata';

import { IntegrationImplementor } from '../Integrations';

export type MessageHandlerType = (User: string, Message: string) => void;

export interface IMessageHandlerMeta {
    ParentClassName: string;
    Valid: true;
}

export const MessageHandler = (): PropertyDecorator => <T extends IntegrationImplementor>(Target: T | object, PropertyKey: string | symbol): void => {
    const Options: IMessageHandlerMeta = {
        ParentClassName: Target.constructor.name,
        Valid: true,
    };

    Reflect.defineMetadata('MessageHandler::Options', Options, Target, PropertyKey);
};
