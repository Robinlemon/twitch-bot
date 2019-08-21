import TriviaBot from '../src/TriviaBot';

describe('Initialisation', () => {
    test('Should Initialise Normally', () => {
        expect(() => new TriviaBot(process.env)).not.toThrow();
    });
});
