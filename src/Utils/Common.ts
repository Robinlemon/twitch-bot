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

export type Opqaue<T, K extends string> = T & { _tag: K };
export type Base64Type = Opqaue<string, '__base64__'>;

export type RemovePromise<T> = T extends Promise<infer R> ? R : never;

export type GetPublicMethodsFromClass<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => void ? T[K] : never;
}[keyof T];

export type ClassMethods<T> = GetPublicMethodsFromClass<T>;
export type ClassMethodReturnPromises<T> = ReturnType<ClassMethods<T>>;
export type ClassMethodReturnTypes<T> = RemovePromise<ClassMethodReturnPromises<T>>;

export type FilterFunc<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => void ? K : never;
}[keyof T];

export default class Common {
    public static MakeRequest = async <T>(ReqOptions: AxiosRequestConfig) => {
        const Response: AxiosResponse<T> = await Axios({
            ...ReqOptions,
            url: `https://opentdb.com/${ReqOptions.url}`,
        });

        return Response.data;
    };

    public static DecodeBase64 = (B64String: Base64Type) => Buffer.from(B64String, 'base64').toString('utf8');
}
