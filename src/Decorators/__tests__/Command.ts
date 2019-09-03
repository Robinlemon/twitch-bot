import Command, { CommandType } from '../Command';

class Test {
    @Command({})
    public test: CommandType = (_1, _2) => {};
}

describe('Command Decorator', () => {
    test('Should Create Metadata', () => {
        const ClassInstance: InstanceType<typeof Test> = new Test();
        const Metadata = Reflect.getMetadata('Command::Options', ClassInstance, 'test');

        expect(Metadata === undefined).toBeFalsy();
    });
});
