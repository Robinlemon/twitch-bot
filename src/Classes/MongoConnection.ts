import Logger, { Levels } from '@robinlemon/logger';
import { MongoError } from 'mongodb';
import Mongoose from 'mongoose';

export default class MongoConnection {
    private Logger = new Logger(this.constructor.name, undefined, Levels.ERROR);

    public constructor(private ConnectionString: string) {}

    public Initialise = async () => {
        await this.Connect();

        Mongoose.connection.on('error', (Err: MongoError) => {
            this.Logger.log(Err);
        });

        Mongoose.connection.on('timeout', (Err: MongoError) => {
            this.Logger.log(Err);
            this.Connect();
        });

        Mongoose.connection.on('close', (Err: MongoError) => {
            this.Logger.log(Err);
            this.Connect();
        });
    };

    private Connect = async (): Promise<void> => {
        try {
            await Mongoose.connect(this.ConnectionString, {
                useNewUrlParser: true,
                autoReconnect: true,
                useFindAndModify: false,
                useCreateIndex: true,
            });

            this.Logger.log('Connected to MongoDB', Levels.DEBUG);
        } catch (Err) {
            this.Logger.log(Err);
        }
    };
}
