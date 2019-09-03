import 'reflect-metadata';

import { IntegrationTypeUnion } from '../Integrations';
export interface ICommandDecoratorOpts {
    Identifiers?: string[];
    Moderator?: boolean;
    Subscriber?: boolean;
    StrictSubscription?: boolean;
    IncludeProtoNameAsIdentifier?: boolean;
    CtxCreator?: () => object;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CommandType = (Context: Record<string, any>, User: string, ...args: unknown[]) => void;

export type ITransformOptions = Required<ICommandDecoratorOpts> & { IntegrationClass: string; MethodName: string };
export type ICommand = Required<Omit<ICommandDecoratorOpts, 'CtxCreator'> & { CtxRetriever?: () => object; Trigger: CommandType }>;
export type ContextTransformer = <T extends IntegrationTypeUnion>(Instance: InstanceType<T>, Input: ITransformOptions) => void;

const Decorator = (Options: ICommandDecoratorOpts = {}): PropertyDecorator => {
    return <T extends IntegrationTypeUnion>(Target: T, PropertyKey: string) => {
        const DefaultOptions: Required<ICommandDecoratorOpts> = {
            Identifiers: [PropertyKey as string],
            Moderator: false,
            Subscriber: true,
            IncludeProtoNameAsIdentifier: true,
            StrictSubscription: false,
            CtxCreator: () => ({}),
        };

        const Identifiers = [
            ...(typeof Options.Identifiers !== 'undefined' ? Options.Identifiers : []),
            ...(typeof DefaultOptions.IncludeProtoNameAsIdentifier !== 'undefined' && Options.IncludeProtoNameAsIdentifier === true
                ? [PropertyKey as string]
                : []),
        ];

        const CommandObj: ITransformOptions = {
            MethodName: PropertyKey as string,
            IntegrationClass: Target.constructor.name,
            ...Object.assign<typeof DefaultOptions, ICommandDecoratorOpts>(DefaultOptions, {
                ...Options,
                Identifiers,
            }),
        };

        Reflect.defineMetadata('Command::Options', CommandObj, Target, PropertyKey);
    };
};

export default Decorator;
