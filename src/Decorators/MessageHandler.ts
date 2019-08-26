import 'reflect-metadata';

import { ChannelProps } from '../test';
import { ClassMethodNamesFilterMethodSignature } from '../Utils/Common';

export type MessageHandlerType = (User: string, Message: string) => any;

export interface IMessageHandlerMeta {
    ParentClassName: string;
    Valid: true;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export default (): any => <T extends ChannelProps, K extends ClassMethodNamesFilterMethodSignature<T, MessageHandlerType>>(Target: T, PropertyKey: K): any => {
    const Options: IMessageHandlerMeta = { Valid: true, ParentClassName: Target.constructor.name };

    Reflect.defineMetadata('MessageHandler', Options, Target[PropertyKey]);
};
