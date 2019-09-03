import Common, { Base64Type } from '../Common';

describe('MakeRequest', () => {
    test('Should Error', () => {
        let Errored = false;

        Common.MakeRequest({})
            .catch((_: Error) => (Errored = true))
            .finally(() => {
                expect(Errored).toBeTruthy();
            });
    });
});

describe('NonRepeatingRandomRange', () => {
    test("Shouldn't repeat", () => {
        const Range = Common.NonRepeatingRandomRange(0, 3);
        const Items = Array.from(Common.IterableTake(Range, 4));
        const HasRepeats = Items.map((k, i) => Items.indexOf(k) !== i).filter(Boolean).length > 0;

        expect(HasRepeats).toBeFalsy();
    });

    test('Should repeat with 1 length', () => {
        const Range = Common.NonRepeatingRandomRange(0, 0);
        const Items = Array.from(Common.IterableTake(Range, 2));
        const HasRepeats = Items.map((k, i) => Items.indexOf(k) !== i).filter(Boolean).length > 0;
        expect(HasRepeats).toBeTruthy();
    });
});

describe('CreateNonRepeatingRandomArrayIterator', () => {
    test("Shouldn't repeat", () => {
        const Range = Common.CreateNonRepeatingRandomArrayIterator(['a', 'b', 'c']);
        const Items = Array.from(Common.IterableTake(Range, 3));
        const HasRepeats = Items.map((k, i) => Items.indexOf(k) !== i).filter(Boolean).length > 0;

        expect(HasRepeats).toBeFalsy();
    });

    test('Should repeat with 1 length', () => {
        const List = ['a'];
        expect(Common.CreateNonRepeatingRandomArrayIterator(List).next().value).toBe(List[0]);
    });
});

describe('RandomiseArray', () => {
    test('Should Randomise', () => {
        const Runs = 100;

        let Success = 0;

        for (let i = 0; i < Runs; i++) {
            const Items = new Array(5).fill(null).map(_ => Math.random());
            const Mixed = Common.RandomiseArray([...Items]);

            if (JSON.stringify(Items) !== JSON.stringify(Mixed)) Success++;
        }

        const Ratio = Success / Runs;
        expect(Ratio).toBeGreaterThanOrEqual(0.95);
    });

    test("Shouldn't do anything with one item", () => {
        const Initial = ['a'];
        const Mixed = Common.RandomiseArray([...Initial]);

        expect(JSON.stringify(Initial)).toBe(JSON.stringify(Mixed));
    });
});

describe('IndexToAlpha', () => {
    test('Lowercase', () => {
        for (let i = 0; i < 10; i++) expect(Common.IndexToAlpha(i, false)).toBe(String.fromCharCode(97 + i));
    });

    test('Uppercase', () => {
        for (let i = 0; i < 10; i++) expect(Common.IndexToAlpha(i, true)).toBe(String.fromCharCode(65 + i));
    });
});

describe('RandomInt', () => {
    test('Should produce a random integer in the range', () => {
        for (let i = 0; i < 10; i++) {
            const Value = Common.RandomInt(0, 1000);
            const InRange = Value >= 0 && Value <= 1000;

            expect(InRange).toBeTruthy();
        }
    });
});

describe('DecodeBase64', () => {
    expect(Common.DecodeBase64('VGVzdA==' as Base64Type)).toBe('Test');
});
