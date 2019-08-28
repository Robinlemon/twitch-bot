import 'reflect-metadata';

import { IntegrationTypeUnion } from '../Integrations';

export type MessageHandlerType = (User: string, Message: string) => any;

export interface IMessageHandlerMeta {
    ParentClassName: string;
    Valid: true;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export default (): PropertyDecorator => <T extends IntegrationTypeUnion>(Target: T, PropertyKey: string) => {
    const Options: IMessageHandlerMeta = {
        Valid: true,
        ParentClassName: Target.constructor.name,
    };

    Reflect.defineMetadata('MessageHandler::Options', Options, Target, PropertyKey);
};
