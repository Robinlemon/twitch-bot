describe('Environment', () => {
    test('Should have an NODE_ENV', () => {
        expect(process.env.NODE_ENV).toBeDefined();
    });
});
