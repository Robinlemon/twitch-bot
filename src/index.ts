import Joi from '@hapi/joi';
import { Logger, LogLevel } from '@robinlemon/logger';
import DotEnv from 'dotenv';
import Path from 'path';

import Bot from './Bot';
import { Schema, SchemaType } from './Utils/Schema';

class Main {
    private Logger = new Logger({ DefaultLevel: LogLevel.WARN, Name: 'GlobalExceptionTracer' });
    private BotInstance!: Bot;

    public constructor() {
        Joi.validate(
            DotEnv.config({ path: Path.resolve(__dirname, '../', '.env') }).parsed,
            Schema,
            { convert: true, noDefaults: false },
            async (Err: Error, Modified) => {
                if (Err) {
                    this.Logger.Log('Invalid .env');
                    this.Logger.Log(Err.message);
                    process.exit(0);
                } else {
                    Object.assign(process.env, Modified);

                    this.BotInstance = new Bot();
                    this.BotInstance.Initialise((process.env as unknown) as SchemaType);
                }
            },
        );
    }
}

new Main();
