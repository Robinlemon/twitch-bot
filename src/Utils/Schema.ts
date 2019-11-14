import 'joi-extract-type';

import * as Joi from '@hapi/joi';

const Schema = Joi.object().keys({
    /**
     * Twitch Credentials
     */
    ChannelsList: Joi.string()
        .regex(/^(#\w+),?\s*?(#\w+)*$/)
        .default('')
        .description('A list of channels to join.'),
    ClientID: Joi.string()
        .required()
        .description('Twitch TV Oauth Application Client ID'),
    ClientSecret: Joi.string()
        .required()
        .description('Twitch TV Oauth Application Client Secret'),
    MongoDBConnectionString: Joi.string()
        .required()
        .regex(/^mongodb\+srv:\/\/(?:(?:(\w+)?:(\w+)?@)|:?@?)([\w-.]+)(?::(\d+))?(?:\/([\w-]+))?(?:\?([\w-]+=[\w-]+(?:&[\w-]+=[\w-]+)*)?)?$/)
        .description('The connection string to a mongodb server.'),
    NODE_ENV: Joi.string()
        .default('production')
        .allow('production', 'development', 'ci', 'test')
        .description('The script environment.'),

    /**
     * External
     */
    TokenFile: Joi.string()
        .default('./tokens.json')
        .description('A file used to store active OAuth access tokens.'),
});

export type SchemaType = Joi.extractType<typeof Schema>;
export default Schema;
