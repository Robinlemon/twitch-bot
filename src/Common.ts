import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export type Opqaue<T, K extends string> = T & { _tag: K };
export type Base64Type = Opqaue<string, '__base64__'>;

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
