import Common, { Base64Type } from '../Utils/Common';

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

interface ICommonResponse {
    response_code: EStatusCode;
}

interface ITokenResponse extends ICommonResponse {
    response_message: string;
    token: string;
}

interface ITokenUpdate extends ICommonResponse {
    token: string;
}

interface IQuestion<Encoding extends QuestionEncoding> {
    category: Encoding extends 'base64' ? Base64Type : EQuestionCategory;
    type: Encoding extends 'base64' ? Base64Type : QuestionType;
    difficulty: Encoding extends 'base64' ? Base64Type : QuestionDifficulty;
    question: Encoding extends 'base64' ? Base64Type : string;
    correct_answer: Encoding extends 'base64' ? Base64Type : string;
    incorrect_answers: (Encoding extends 'base64' ? Base64Type : string)[];
}

interface IQuestionsResponse<Encoding extends QuestionEncoding> extends ICommonResponse {
    results: IQuestion<Encoding>[];
}

interface IRequestArgs<Encoding extends QuestionEncoding> {
    amount: number;
    category?: EQuestionCategory;
    difficulty?: QuestionDifficulty;
    type?: QuestionType;
    encode?: Encoding;
}

export default class QuestionCoordinator {
    public static GenerateSession = () =>
        Common.MakeRequest<ITokenResponse>({
            url: 'api_token.php',
            params: {
                command: 'request',
            },
        });

    public static ResetSession = (Session: string) =>
        Common.MakeRequest<ITokenUpdate>({
            url: 'api_token.php',
            params: {
                command: 'reset',
                token: Session,
            },
        });

    public static GetQuestions = <T extends QuestionEncoding>(Session: string, Options: IRequestArgs<T>) =>
        Common.MakeRequest<IQuestionsResponse<T>>({
            url: 'api.php',
            params: Object.assign(
                {
                    amount: 10,
                    token: Session,
                },
                Options,
            ),
        });
}
