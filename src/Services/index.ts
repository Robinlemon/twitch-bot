import Logger, { Levels } from '@robinlemon/logger';

import { Channel } from '../Channel';
import { ChannelProps } from '../test';

const InjectorLogger = new Logger('Injector', undefined, Levels.DEBUG);

export interface IInjectable {
    InjectOverride: () => void;
}

/**
 * Custom Built Prototypal Injector Solution
 */
export default <T extends typeof ChannelProps>(DerivedCtor: typeof Channel, BaseCtors: T[]) => {
    BaseCtors.forEach(BaseCtor => {
        Object.getOwnPropertyNames(BaseCtor.prototype).forEach(name =>
            Object.defineProperty(DerivedCtor.prototype, name, Object.getOwnPropertyDescriptor(BaseCtor.prototype, name)),
        );

        const CtorText = BaseCtor.prototype.constructor.toString();
        const Regex = /constructor\(\) \{\s+super\([^)]*\);((?:\s+this\.(?!.+\()[^\n]+)+)/g;
        const Match = Regex.exec(CtorText);
        const Pairs = Match[1]
            .split('\n')
            .filter(Line => Line.trim().length > 0)
            .map(Line => Line.split('=').map(Component => Component.trim().replace(/(?:this\.)|;/g, '')));

        /* eslint-disable @typescript-eslint/no-explicit-any */
        DerivedCtor.prototype.InjectOverride = function(this: InstanceType<typeof DerivedCtor> & { [index: string]: any }) {
            for (const [Key, Val] of Pairs) {
                try {
                    const JSType = eval(Val);
                    InjectorLogger.log(`Setting ${Key} = <${typeof JSType}>${JSType} on ${this.constructor.name}`);
                    this[Key] = JSType;
                } catch {
                    InjectorLogger.log(`Setting ${Key} = ${Val} on ${this.constructor.name} -> EVAL ERROR [Skipping]`, Levels.SILLY);
                }
            }
        };
        /* eslint-enable @typescript-eslint/no-explicit-any */
    });

    return DerivedCtor;
};

export { default as Trivia } from './Trivia';
