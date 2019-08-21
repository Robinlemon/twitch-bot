import Joi from '@hapi/joi';
import Logger, { Levels } from '@robinlemon/logger';
import DotEnv from 'dotenv';

import Schema, { SchemaType } from './Schema';
import TriviaBot from './TriviaBot';

class Main {
    private Logger = new Logger('GlobalExceptionTracer', Levels.SILLY, Levels.WARN);
    private BotInstance: TriviaBot;

    public constructor() {
        this.Bind();
        this.Bootstrap();
    }

    private Bootstrap = (): void =>
        Joi.validate(DotEnv.config().parsed, Schema, { convert: true, noDefaults: false }, (Err: Error, Modified) => {
            if (Err) {
                this.Logger.log('Invalid .env');
                this.Logger.log(Err.message);
                process.exit(0);
            } else {
                Object.assign(process.env, Modified);

                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                this.BotInstance = new TriviaBot((process.env as any) as SchemaType);
            }
        });

    private Bind = () => {
        process.on('unhandledRejection', (Reason: Error) => this.Logger.log(Reason));
        process.on('beforeExit', () => this.Destroy());
    };

    private Destroy = (): void => (this.BotInstance = null);
}

new Main();
