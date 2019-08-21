import Crypto from 'crypto';
import MockedEnv from 'mocked-env';

import { SchemaType } from '../src/Schema';
import TriviaBot from '../src/TriviaBot';

describe('Initialisation', () => {
    let Restore: ReturnType<typeof MockedEnv>;

    beforeEach(() => {
        const MockEnvironment: SchemaType = {
            ClientID: Crypto.randomBytes(15).toString('hex'),
            ClientSecret: Crypto.randomBytes(15).toString('hex'),
            ChannelsList: '',
        };

        Restore = MockedEnv(MockEnvironment);
    });

    afterEach(() => Restore());

    test('Normally Constructed', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => new TriviaBot()).not.toThrow();
    });
});
