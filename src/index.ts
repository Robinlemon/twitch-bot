import Joi from '@hapi/joi';
import Logger, { Levels } from '@robinlemon/logger';
import DotEnv from 'dotenv';
import Path from 'path';

import TriviaBot from './TriviaBot';
import Schema, { SchemaType } from './Utils/Schema';

class Main {
    private Logger = new Logger('GlobalExceptionTracer', Levels.SILLY, Levels.WARN);
    private BotInstance: TriviaBot;

    public constructor() {
        Joi.validate(
            DotEnv.config({ path: Path.resolve(__dirname, '../', '.env') }).parsed,
            Schema,
            { convert: true, noDefaults: false },
            async (Err: Error, Modified) => {
                if (Err) {
                    this.Logger.log('Invalid .env');
                    this.Logger.log(Err.message);
                    process.exit(0);
                } else {
                    Object.assign(process.env, Modified);

                    this.BotInstance = new TriviaBot();
                    this.BotInstance.Initialise((process.env as unknown) as SchemaType);
                }
            },
        );
    }
}

new Main();
