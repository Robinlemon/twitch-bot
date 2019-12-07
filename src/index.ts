import Joi from '@hapi/joi';
import { Logger as LoggerClass, LogLevel } from '@robinlemon/logger';
import DotEnv from 'dotenv';
import Path from 'path';

import Bot from './Bot';
import { Schema, SchemaType } from './Utils/Schema';

const Logger = new LoggerClass({ DefaultLevel: LogLevel.WARN, Name: 'Exception Tracer' });

Joi.validate(
    DotEnv.config({ path: Path.resolve(__dirname, '../../', '.env') }).parsed,
    Schema,
    { convert: true, noDefaults: false },
    (Err: Error, Modified) => {
        if (Err) {
            Logger.Log('Invalid .env');
            Logger.Log(Err.message);
        } else {
            Object.assign(process.env, Modified);
            new Bot().Initialise(({ ...process.env, ...Modified } as unknown) as SchemaType);
        }
    },
);
