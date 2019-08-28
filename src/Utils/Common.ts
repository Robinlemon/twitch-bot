import Logger, { Levels } from '@robinlemon/logger';
import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface ITokenCommon {
    accessToken: string;
    refreshToken: string;
}

export interface ITokenResponse extends ITokenCommon {
    expiryDate: Date;
}

export interface ITokenSerialised extends ITokenCommon {
    expiryTimestamp: number;
}

export type Opaque<T, K extends string> = T & { _tag: K };
export type Base64Type = Opaque<string, '__base64__'>;

export type RemovePromise<T> = T extends Promise<infer R> ? R : never;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type FuncParams<
    T extends {
        [prop: string]: any;
    },
    K extends keyof T
> = Parameters<T[K]>[0];

export type ClassType = { new (...args: any[]): any };
/* eslint-enable @typescript-eslint/no-explicit-any */

export type GetPublicMethodsFromClass<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => void ? T[K] : never;
}[keyof T];

export type GetPublicMethodNamesFromClass<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => void ? K : never;
}[keyof T];

export type ClassMethodNamesFilterMethodSignature<T, U> = {
    [K in keyof T]: U extends T[K] ? K : never;
}[keyof T];

/* All public method names from a class */
export type ClassMethodNames<T> = GetPublicMethodNamesFromClass<T>;

/* All public method types from a class */
export type ClassMethodTypes<T> = GetPublicMethodsFromClass<T>;

export type ClassMethodReturnPromises<T> = ReturnType<ClassMethodTypes<T>>;
export type ClassMethodReturnTypes<T> = RemovePromise<ClassMethodReturnPromises<T>>;

export type ClassStaticProps<T> = Omit<T, 'prototype'>;

export type Identity<T> = T;
export type Merge_NonUnion<T> = { [k in keyof T]: T[k] };
export type Simplify<T> = T extends Identity<T> ? Merge_NonUnion<T> : never;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type RemoveFirstFromTuple<T extends any[]> = T['length'] extends 0 ? undefined : (((...b: T) => void) extends (a: any, ...b: infer I) => void ? I : []);
export type RemoveFirstParam<T extends (...args: any[]) => any> = (...params: RemoveFirstFromTuple<Parameters<T>>) => ReturnType<T>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export default class Common {
    public static Logger = new Logger('Common', undefined, Levels.WARN);

    public static MakeRequest = async <T>(ReqOptions: AxiosRequestConfig) => {
        const Response: AxiosResponse<T> = await Axios({
            ...ReqOptions,
            url: `https://opentdb.com/${ReqOptions.url}`,
        });

        return Response.data;
    };

    public static *CreateNonRepeatingRandomArrayIterator<T>(List: T[]): IterableIterator<T> {
        while (true) for (const IDx of Common.NonRepeatingRandomRange(0, List.length - 1)) yield List[IDx];
    }

    public static *NonRepeatingRandomRange(Minimum: number, Maximum: number): IterableIterator<number> {
        let LastNum = -1;

        while (true)
            for (const Item of Common.RandomiseArray(new Array(Maximum - Minimum + 1).fill(0).map((_, IDx) => IDx + Minimum)).filter(
                Num => Num !== (Maximum - Minimum > 0 ? LastNum : undefined),
            ))
                yield (LastNum = Item);
    }

    public static CircularReplacer = () => {
        const Cache = new WeakSet();

        return (_Key: string, Value: unknown) => {
            if (typeof Value === 'object' && Value !== null) {
                if (Cache.has(Value)) return;
                else Cache.add(Value);
            }

            return Value;
        };
    };

    public static RandomiseArray = <T>(List: T[]): T[] => {
        for (let i = List.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [List[i], List[j]] = [List[j], List[i]];
        }
        return List;
    };

    public static IndexToAlpha = <T extends string>(Offset: number, Uppercase: boolean = false) => String.fromCharCode((Uppercase ? 65 : 97) + Offset) as T;
    public static RandomInt = (Minimum: number, Maximum: number) => Math.floor(Math.random() * (Maximum - Minimum + 1) + Minimum);
    public static DecodeBase64 = (B64String: Base64Type) => Buffer.from(B64String, 'base64').toString('utf8');
}
