import { IntegrationImplementor } from '../Integrations';
export interface ICommandDecoratorOpts {
    Identifiers?: string[];
    Moderator?: boolean;
    Subscriber?: boolean;
    StrictSubscription?: boolean;
    IncludeProtoNameAsIdentifier?: boolean;
    CtxCreator?: () => object;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CommandType = (Context: Record<string, any>, User: string, ...args: string[]) => void;

export type ITransformOptions = Required<ICommandDecoratorOpts> & { IntegrationClass: string; MethodName: string };
export type ICommand = Required<Omit<ICommandDecoratorOpts, 'CtxCreator'> & { CtxRetriever?: () => object; Trigger: CommandType }>;
export type ContextTransformer = <T extends IntegrationImplementor>(Instance: InstanceType<T>, Input: ITransformOptions) => void;

export const Command = (Options: ICommandDecoratorOpts = {}): PropertyDecorator => {
    return <T extends IntegrationImplementor>(Target: T | object, PropertyKey: string | symbol): void => {
        const DefaultOptions: Required<ICommandDecoratorOpts> = {
            CtxCreator: () => ({}),
            Identifiers: [PropertyKey as string],
            IncludeProtoNameAsIdentifier: true,
            Moderator: false,
            StrictSubscription: false,
            Subscriber: true,
        };

        const Identifiers = [
            ...(typeof Options.Identifiers !== 'undefined' ? Options.Identifiers : []),
            ...(typeof DefaultOptions.IncludeProtoNameAsIdentifier !== 'undefined' && Options.IncludeProtoNameAsIdentifier === true
                ? [PropertyKey as string]
                : []),
        ];

        const CommandObj: ITransformOptions = {
            IntegrationClass: Target.constructor.name,
            MethodName: PropertyKey as string,
            ...Object.assign<typeof DefaultOptions, ICommandDecoratorOpts>(DefaultOptions, {
                ...Options,
                Identifiers,
            }),
        };

        Reflect.defineMetadata('Command::Options', CommandObj, Target, PropertyKey);
    };
};
