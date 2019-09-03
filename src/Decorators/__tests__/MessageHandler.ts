import MessageHandler, { MessageHandlerType } from '../MessageHandler';

class Test {
    @MessageHandler()
    public test: MessageHandlerType = (_1, _2) => {};
}

describe('Command Decorator', () => {
    test('Should Create Metadata', () => {
        const ClassInstance: InstanceType<typeof Test> = new Test();
        const Metadata = Reflect.getMetadata('MessageHandler::Options', ClassInstance, 'test');

        expect(Metadata === undefined).toBeFalsy();
    });
});
