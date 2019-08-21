import 'joi-extract-type';

import * as Joi from '@hapi/joi';

const Schema = Joi.object().keys({
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
