import { Logger, LogLevel } from '@robinlemon/logger';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import TwitchClient from 'twitch';

import { MessageQueueDispatcher } from '../Classes/MessageQueueDispatcher';
import { ClassType } from '../Utils/Common';

export type IntegrationImplementor = ClassType & Integration;
export type IntegrationCtorFn = (ChannelName: string, MessageHandler: MessageQueueDispatcher, Logger: Logger, Client: TwitchClient) => IntegrationImplementor;

export abstract class Integration {
    private static Logger = new Logger({ Name: 'Integration' });

    protected abstract ChannelName: string;
    protected abstract MessageHandler: MessageQueueDispatcher;
    protected abstract Logger: Logger;

    public abstract get Identifier(): string;

    public static async LoadIntegrations(): Promise<IntegrationImplementor[]> {
        const IntegrationList: IntegrationImplementor[] = [];

        const Files = await fs.readdir(__dirname);
        const Stats = await Promise.all(
            Files.map(async Name => ({
                Name,
                Stats: await fs.stat(resolve(__dirname, Name)),
            })),
        );
        const Folders = Stats.filter(({ Stats }) => Stats.isDirectory()).map(({ Name }) => Name);
        const IntegrationFiles = await Promise.all(
            Folders.map(async Name => ({
                Files: await fs.readdir(resolve(__dirname, Name)),
                Name,
            })),
        );

        for (const Integration of IntegrationFiles) {
            const ServiceFileIndex = Integration.Files.indexOf(`${Integration.Name}.service.js`);

            if (ServiceFileIndex > -1) {
                const File = await import(resolve(__dirname, Integration.Name, Integration.Files[ServiceFileIndex]));

                if (Object.keys(File).includes(Integration.Name)) IntegrationList.push(File[Integration.Name] as IntegrationImplementor);
                else this.Logger.Log(LogLevel.WARN, `Invalid export in Integration::${Integration.Name}/${Integration.Files[ServiceFileIndex]}.`);
            } else {
                this.Logger.Log(LogLevel.WARN, `Couldn't find service file for Integration::${Integration.Name}.`);
                this.Logger.Log(LogLevel.WARN, Integration.Files);
                this.Logger.Log(LogLevel.WARN, `${Integration.Name}.service.js`);
            }
        }

        return IntegrationList;
    }
}
