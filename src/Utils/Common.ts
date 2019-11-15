import { Logger } from '@robinlemon/logger';
import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface ITokenCommon {
    accessToken: string;
    refreshToken: string;
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

export interface ClassType {
    new <T extends object>(...args: any[]): T;
}

export type GetPublicMethodsFromClass<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
}[keyof T];

export type GetPublicMethodNamesFromClass<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
/* eslint-enable @typescript-eslint/no-explicit-any */

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
export type RemoveFirstFromTuple<T extends any[]> = T['length'] extends 0 ? [] : ((...b: T) => void) extends (a: any, ...b: infer I) => void ? I : [];
export type RemoveFirstParam<T extends (...args: any[]) => any> = (...params: RemoveFirstFromTuple<Parameters<T>>) => ReturnType<T>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export class Common {
    public static Logger = new Logger({ Name: 'Common' });

    public static MakeRequest = async <T>(ReqOptions: AxiosRequestConfig): Promise<T> => {
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

    public static CircularReplacer = (): (<T extends object>(_Key: string, Value: T) => T | void) => {
        const Cache = new WeakSet();

        return <T extends object>(_Key: string, Value: T): T | void => {
            if (typeof Value === 'object' && Value !== null) {
                if (Cache.has(Value)) return;
                else Cache.add(Value);
            }

            return Value;
        };
    };

    public static RandomiseArray = <T>(Input: T[]): T[] => {
        const List = [...Input];

        for (let i = List.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [List[i], List[j]] = [List[j], List[i]];
        }
        return List;
    };

    public static IterableTake = <T>(Iterator: IterableIterator<T>, Amount: number): T[] | never => {
        const Result = [];

        if (Amount <= 0) throw new Error('Invalid index');
        for (let i = 0; i < Amount; i++) {
            const { value, done } = Iterator.next();

            if (done && i < Amount) throw new Error(`Generator has fewer than ${Amount} elements`);
            else Result.push(value);
        }

        return Result;
    };

    public static IndexToAlpha = <T extends string>(Offset: number, Uppercase = false): T => String.fromCharCode((Uppercase ? 65 : 97) + Offset) as T;
    public static RandomInt = (Minimum: number, Maximum: number): number => Math.floor(Math.random() * (Maximum - Minimum + 1) + Minimum);
    public static DecodeBase64 = (B64String: Base64Type): string => Buffer.from(B64String, 'base64').toString('utf8');

    public static TimeDifference = (Timestamp: number): number => Date.now() - Timestamp;
}
