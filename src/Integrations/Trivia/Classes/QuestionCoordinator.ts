import { Logger, LogLevel } from '@robinlemon/logger';
import Retry from 'async-retry';

import Common, { Base64Type, ClassMethodReturnTypes } from '../../../Utils/Common';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple' | 'boolean';
export type QuestionEncoding = 'urlLegacy' | 'url3986' | 'base64';

export enum EStatusCode {
    'Success' = 0, // Success - Returned results successfully.
    'NoResults' = 1, // No Results - Could not return results. The API doesn't have enough questions for your query. (Ex. Asking for 50 Questions in a Category that only has 20.)
    'InvalidParameter' = 2, // Invalid Parameter - Contains an invalid parameter. Arguements passed in aren't valid. (Ex. Amount = Five)
    'TokenNotFound' = 3, // Token Not Found - Session Token does not exist.
    'TokenEmpty' = 4, // Token Empty - Session Token has returned all possible questions for the specified query. Resetting the Token is necessary.
}

export enum EQuestionCategory {
    'Any Category' = 'any',
    'General Knowledge' = 9,
    'Entertainment: Books' = 10,
    'Entertainment: Film' = 11,
    'Entertainment: Music' = 12,
    'Entertainment: Musicals & Theatres' = 13,
    'Entertainment: Television' = 14,
    'Entertainment: Video Games' = 15,
    'Entertainment: Board Games' = 16,
    'Science & Nature' = 17,
    'Science: Computers' = 18,
    'Science: Mathematics' = 19,
    'Mythology' = 20,
    'Sports' = 21,
    'Geography' = 22,
    'History' = 23,
    'Politics' = 24,
    'Art' = 25,
    'Celebrities' = 26,
    'Animals' = 27,
    'Vehicles' = 28,
    'Entertainment: Comics' = 29,
    'Science: Gadgets' = 30,
    'Entertainment: Japanese Anime & Manga' = 31,
    'Entertainment: Cartoon & Animations' = 32,
}

export interface ICommonResponse {
    response_code: EStatusCode;
}

export interface ITokenResponse extends ICommonResponse {
    response_message: string;
    token: string;
}

export interface ITokenUpdate extends ICommonResponse {
    token: string;
}

export interface IQuestion<Encoding extends QuestionEncoding> {
    category: Encoding extends 'base64' ? Base64Type : EQuestionCategory;
    type: Encoding extends 'base64' ? Base64Type : QuestionType;
    difficulty: Encoding extends 'base64' ? Base64Type : QuestionDifficulty;
    question: Encoding extends 'base64' ? Base64Type : string;
    correct_answer: Encoding extends 'base64' ? Base64Type : string;
    incorrect_answers: (Encoding extends 'base64' ? Base64Type : string)[];
}

export interface IQuestionsResponse<Encoding extends QuestionEncoding> extends ICommonResponse {
    results: IQuestion<Encoding>[];
}

export interface IRequestArgs<Encoding extends QuestionEncoding> {
    amount: number;
    category?: EQuestionCategory;
    difficulty?: QuestionDifficulty;
    type?: QuestionType;
    encode?: Encoding;
}

export default class QuestionCoordinator {
    public static Logger = new Logger({ Name: 'QuestionCoordinator' });

    public static GenerateSession(): Promise<ITokenResponse | never> {
        return Common.MakeRequest<ITokenResponse>({
            params: {
                command: 'request',
            },
            url: 'api_token.php',
        });
    }

    public static ResetSession(Session: string): Promise<ITokenUpdate | never> {
        return Common.MakeRequest<ITokenUpdate>({
            params: {
                command: 'reset',
                token: Session,
            },
            url: 'api_token.php',
        });
    }

    public static GetQuestions<T extends QuestionEncoding>(Session: string, Options: IRequestArgs<T>): Promise<IQuestionsResponse<T> | never> {
        return Common.MakeRequest<IQuestionsResponse<T>>({
            params: Object.assign(
                {
                    amount: 10,
                    token: Session,
                },
                Options,
            ),
            url: 'api.php',
        });
    }
}

export const RetryQuestionApi = <T extends ClassMethodReturnTypes<typeof QuestionCoordinator>>(
    Fn: () => Promise<T>,
    forever = false,
    Session?: string,
): Promise<T> =>
    Retry(
        async (): Promise<T> => {
            const Response = await Fn();

            switch (Response.response_code) {
                /**
                 * Success - Returned results successfully.
                 */
                case EStatusCode.Success:
                    return Response;

                /**
                 * No Results - Could not return results.
                 *
                 * The API doesn't have enough questions for your query. (Ex. Asking for 50 Questions in a Category that only has 20.)
                 */
                case EStatusCode.NoResults:
                    await RetryQuestionApi((): Promise<ITokenUpdate> => QuestionCoordinator.ResetSession(Session!), true);
                    throw new Error('Token Reset');

                /**
                 * Invalid Parameter - Contains an invalid parameter.
                 *
                 * Arguments passed in aren't valid. (Ex. Amount = Five)
                 */
                case EStatusCode.InvalidParameter:
                    throw new Error('Invalid Parameters');

                /**
                 * Token Not Found - Session Token does not exist.
                 */
                case EStatusCode.TokenNotFound:
                    throw new Error('Token Not Specified');

                /**
                 * Token Empty - Session Token has returned all possible questions for the specified query.
                 *
                 * Resetting the Token is necessary.
                 */
                case EStatusCode.TokenEmpty:
                    await RetryQuestionApi(() => QuestionCoordinator.ResetSession(Session!), true);
                    throw new Error('Token Reset');

                default:
                    throw new Error('Malformed Response');
            }
        },
        {
            forever,
            onRetry: (Err, Attempt): void => {
                QuestionCoordinator.Logger.Log(LogLevel.WARN, `Attempt ${Attempt}: ${Err}`);
            },
            retries: 10,
        },
    );
