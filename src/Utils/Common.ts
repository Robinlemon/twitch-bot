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
/* eslint-enable @typescript-eslint/no-explicit-any */

export type GetPublicMethodsFromClass<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => void ? T[K] : never;
}[keyof T];

export type GetPublicMethodNamesFromClass<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => void ? K : never;
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
    public static MakeRequest = async <T>(ReqOptions: AxiosRequestConfig) => {
        const Response: AxiosResponse<T> = await Axios({
            ...ReqOptions,
            url: `https://opentdb.com/${ReqOptions.url}`,
        });

        return Response.data;
    };

    public static IndexToAlpha = <T extends string>(Offset: number, Uppercase: boolean = false) => String.fromCharCode((Uppercase ? 65 : 97) + Offset) as T;
    public static RandomInt = (Minimum: number, Maximum: number) => Math.floor(Math.random() * (Maximum - Minimum + 1) + Minimum);
    public static DecodeBase64 = (B64String: Base64Type) => Buffer.from(B64String, 'base64').toString('utf8');
}
