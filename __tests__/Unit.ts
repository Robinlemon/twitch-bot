import Crypto from 'crypto';
import MockedEnv from 'mocked-env';

import TriviaBot from '../src/Bot';
import { SchemaType } from '../src/Utils/Schema';

type Convert<T> = {
    [K in keyof T]: T[K];
} & { [idx: string]: string };

describe('Initialisation', () => {
    let Restore: ReturnType<typeof MockedEnv>;

    beforeEach(() => {
        const MockEnvironment: Partial<Convert<SchemaType>> = {
            ChannelsList: '',
            ClientID: Crypto.randomBytes(15).toString('hex'),
            ClientSecret: Crypto.randomBytes(15).toString('hex'),
            MongoDBConnectionString: '',
            QuestionFormat: '%Question% | %Answers%',
        };

        Restore = MockedEnv(MockEnvironment);
    });

    afterEach(() => Restore());

    test('Normally Constructed', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => new TriviaBot()).not.toThrow();
    });
});
