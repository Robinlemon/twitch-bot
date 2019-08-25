import 'joi-extract-type';

import * as Joi from '@hapi/joi';

const Schema = Joi.object().keys({
    /**
     * Twitch Credentials
     */
    ClientID: Joi.string()
        .required()
        .description('Twitch TV Oauth Application Client ID'),
    ClientSecret: Joi.string()
        .required()
        .description('Twitch TV Oauth Application Client Secret'),
    ChannelsList: Joi.string()
        .regex(/^(\#\w+),?\s*?(\#\w+)*$/)
        .default('')
        .description('A list of channels to join.'),
    TokenFile: Joi.string()
        .default('./tokens.json')
        .description('A file used to store active OAuth access tokens.'),

    /**
     * External
     */
    NODE_ENV: Joi.string()
        .default('production')
        .allow('production', 'development', 'ci', 'test')
        .description('The script environment.'),
});

export type SchemaType = Joi.extractType<typeof Schema>;
export default Schema;
