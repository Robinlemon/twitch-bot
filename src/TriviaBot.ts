import Logger from '@robinlemon/logger';

import { SchemaType } from './Schema';

export default class TriviaBot {
    private Logger = new Logger(this.constructor.name);

    public constructor(private Environment: SchemaType) {}
}
