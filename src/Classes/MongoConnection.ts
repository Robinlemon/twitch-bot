import { Logger, LogLevel } from '@robinlemon/logger';
import { MongoError } from 'mongodb';
import Mongoose from 'mongoose';

export class MongoConnection {
    private Logger = new Logger({ DefaultLevel: LogLevel.ERROR, Name: this.constructor.name });

    public constructor(private ConnectionString: string) {}

    public Initialise = async (): Promise<void> => {
        await this.Connect();

        Mongoose.connection.on('error', (Err: MongoError) => {
            this.Logger.Log(Err);
        });

        Mongoose.connection.on('timeout', (Err: MongoError) => {
            this.Logger.Log(Err);
            this.Connect();
        });

        Mongoose.connection.on('close', (Err: MongoError) => {
            this.Logger.Log(Err);
            this.Connect();
        });

        Mongoose.connection.on('disconnect', () => {
            this.Connect();
        });
    };

    private Connect = async (): Promise<void> => {
        try {
            await Mongoose.connect(this.ConnectionString, {
                useCreateIndex: true,
                useFindAndModify: false,
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });

            this.Logger.Log(LogLevel.DEBUG, 'Connected to MongoDB');
        } catch (Err) {
            this.Logger.Log(Err);
        }
    };
}
