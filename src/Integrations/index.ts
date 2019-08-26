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

        if (Match !== null) {
            const Pairs = Match[1]
                .split('\n')
                .filter(Line => Line.trim().length > 0)
                .map(Line => Line.split('=').map(Component => Component.trim().replace(/(?:this\.)|;/g, '')))
                .reduce<([string, unknown])[]>((Accumulator, [Key, Val]) => {
                    try {
                        return [
                            ...Accumulator,
                            [Key, Val.includes('}') ? JSON.parse(Val.replace(/'/g, '"').replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ')) : eval(Val)],
                        ];
                    } catch {
                        return Accumulator;
                    }
                }, []);

            Pairs.forEach(([Key, Val]) =>
                InjectorLogger.log(
                    `[${BaseCtor.name}] Injecting ${Key}: ${typeof Val} = ${typeof Val === 'object' ? JSON.stringify(Val) : Val.toString()}`,
                    Levels.VERBOSE,
                ),
            );

            /* eslint-disable @typescript-eslint/no-explicit-any */
            DerivedCtor.prototype.InjectOverride = function(this: InstanceType<typeof DerivedCtor> & { [index: string]: any }) {
                for (const [Key, Val] of Pairs) this[Key] = Val;
            };
            /* eslint-enable @typescript-eslint/no-explicit-any */
        }
    });

    return DerivedCtor;
};

import * as BasicCommandMapping from './BasicCommandMapping';
import * as ExtensionCommands from './ExtensionCommands';
import * as Trivia from './Trivia';

export { Trivia, ExtensionCommands, BasicCommandMapping };
