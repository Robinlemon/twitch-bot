import 'reflect-metadata';

import { ChannelProps } from '../test';
import { ClassMethodNames, ClassType } from '../Utils/Common';

export type CommandType = (User: string, ...args: unknown[]) => void;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
interface ICommandDecoratorOpts {
    ServiceReference: ClassType;
    Identifiers?: string[];
    Moderator?: boolean;
    Subscriber?: boolean;
    StrictSubscription?: boolean;
    IncludeProtoNameAsIdentifier?: boolean;
}

type ICtxResult = { CtxRetriever?: () => object };
type ICtxOption = {
    CtxCreator?: () => object;
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type ICommandStandard<T = 'a'> = Required<ICommandDecoratorOpts> & {
    Trigger: T extends 'a' ? CommandType : ClassMethodNames<T>;
    Params: unknown[];
};

export type PreContext<T = 'a'> = Required<ICtxOption> & ICommandStandard<T>;
export type PostContext<T = 'a'> = Required<ICtxResult> & ICommandStandard<T>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export default (Options: ICommandDecoratorOpts & ICtxOption = { ServiceReference: undefined }): any => {
    return <T extends ChannelProps>(Target: T, PropertyKey: ClassMethodNames<T>, _Descriptor: TypedPropertyDescriptor<T[ClassMethodNames<T>]>) => {
        const DefaultOptions: Required<ICommandDecoratorOpts & ICtxOption> = {
            ServiceReference: undefined,
            Identifiers: [PropertyKey as string],
            Moderator: false,
            Subscriber: true,
            IncludeProtoNameAsIdentifier: true,
            StrictSubscription: false,
            CtxCreator: () => ({}),
        };

        const Identifiers = [
            ...Options.Identifiers,
            ...(DefaultOptions.IncludeProtoNameAsIdentifier && Options.IncludeProtoNameAsIdentifier ? [PropertyKey as string] : []),
        ];

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const CommandObj: PreContext<T> = {
            Trigger: PropertyKey as any,
            Params: Reflect.getMetadata('design:paramtypes', Target, PropertyKey as string),
            ...Object.assign<Required<ICommandDecoratorOpts & ICtxOption>, ICommandDecoratorOpts & ICtxOption>(DefaultOptions, {
                ...Options,
                Identifiers,
            }),
        };
        /* eslint-enable @typescript-eslint/no-explicit-any */

        Reflect.defineMetadata('Command::Options', CommandObj, Target[PropertyKey]);
    };
};
