describe('Environment', () => {
    ['NODE_ENV', 'ClientID', 'ClientSecret', 'ChannelsList', 'QuestionFormat'].map(NameSpace =>
        test(`Should have an ${NameSpace}`, () => expect(process.env[NameSpace]).toBeDefined()),
    );
});
