import 'reflect-metadata';

import { ChannelProps } from '../test';
import { ClassMethodNames } from '../Utils/Common';

interface ICommandDecoratorOptions {
    Identifiers?: string[];
    IncludeProtoNameAsIdentifier?: boolean;
    Moderator?: boolean;
    Subscriber?: boolean;
    StrictSubscription?: boolean;
}

export type CommandType = (User: string, ...args: unknown[]) => void;

export type ICommand<T = 'a'> = Required<ICommandDecoratorOptions> & {
    Trigger: T extends 'a' ? CommandType : ClassMethodNames<T>;
    Params: unknown[];
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export default (Options: ICommandDecoratorOptions = {}): any => {
    return <T extends ChannelProps>(Target: T, PropertyKey: ClassMethodNames<T>, _Descriptor: TypedPropertyDescriptor<T[ClassMethodNames<T>]>) => {
        const DefaultOptions: Required<ICommandDecoratorOptions> = {
            Identifiers: [PropertyKey as string],
            Moderator: false,
            Subscriber: true,
            IncludeProtoNameAsIdentifier: true,
            StrictSubscription: false,
        };

        const Identifiers = [
            ...Options.Identifiers,
            ...(DefaultOptions.IncludeProtoNameAsIdentifier && Options.IncludeProtoNameAsIdentifier ? [PropertyKey as string] : []),
        ];

        const CommandObj: ICommand<T> = {
            Trigger: PropertyKey as any,
            Params: Reflect.getMetadata('design:paramtypes', Target, PropertyKey as string),
            ...Object.assign<Required<ICommandDecoratorOptions>, ICommandDecoratorOptions>(DefaultOptions, {
                ...Options,
                Identifiers,
            }),
        };

        Reflect.defineMetadata('Command::Options', CommandObj, Target[PropertyKey]);
    };
};
