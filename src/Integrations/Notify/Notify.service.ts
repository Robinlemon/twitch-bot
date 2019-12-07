import 'reflect-metadata';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Logger, LogLevel } from '@robinlemon/logger';
import ms from 'ms';

import { MessageQueueDispatcher } from '../../Classes/MessageQueueDispatcher';
import { Command, CommandType } from '../../Decorators/Command';
import { MessageHandler } from '../../Decorators/MessageHandler';
import { Common } from '../../Utils/Common';
import { Integration } from '../index';
import NotificationModel from './Notify.model';

export class Notify extends Integration {
    public constructor(protected ChannelName: string, protected MessageHandler: MessageQueueDispatcher, protected Logger: Logger) {
        super();
    }

    public get Identifier(): string {
        return this.constructor.name;
    }

    @Command({
        Identifiers: ['notify'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: false,
    })
    public Notify: CommandType = async (_Context, User, Recipient, ...MessageParts): Promise<void> => {
        /**
         * Return if no recipient specified.
         */
        if (!Recipient || Recipient.length === 0) return;

        /**
         * Return if the @ symbol is not at the beginning of one exists.
         */
        if (Recipient.includes('@') && !Recipient.startsWith('@')) return;

        /**
         * Return if more than one @ symbol in name.
         */
        const AtSymbolMatch = Recipient.match(/@/g);
        if (AtSymbolMatch?.length) return;

        /**
         * Remove @ symbol if one exists.
         */
        if (Recipient.startsWith('@')) Recipient = Recipient.slice(1);

        /**
         * Return if no message specified.
         */
        const FullMessage = MessageParts.join(' ');
        if (FullMessage.length === 0) return;

        /**
         * Lowercase both names
         */
        User = User.toLowerCase();
        Recipient = Recipient.toLowerCase();

        /**
         * Add a message to the model database
         */
        try {
            await NotificationModel.findOneAndUpdate(
                /**
                 * Find:
                 *  -> An existing document and update
                 *  -> Nothing and upsert a new document
                 */
                { To: Recipient },
                {
                    From: User,
                    Issued: Date.now(),
                    Message: FullMessage,
                    To: Recipient,
                },
                {
                    new: true,
                    setDefaultsOnInsert: true,
                    upsert: true,
                },
            );

            /**
             * Send a message if succesful
             */
            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `@${User} The user ${Recipient} will receive your message once they next talk in chat FeelsOkayMan TeaTime`,
            });
        } catch (Err) {
            /* Log db transaction errors */
            this.Logger.Log(LogLevel.ERROR, Err);
        }
    };

    @MessageHandler()
    public CheckForNotifications = async (User: string): Promise<void> => {
        try {
            /* Look if a notification exists */
            const MessageObj = await NotificationModel.findOneAndRemove({ To: User });

            /* If one does exist (not null) */
            if (MessageObj !== null) {
                /* Prepare a message template */
                const Template = `@${MessageObj.To} -> ${MessageObj.From} left you a message ${ms(
                    Common.TimeDifference(MessageObj.Issued),
                )} ago FeelsOkayMan 👉 ${MessageObj.Message}`;

                this.MessageHandler.Send({
                    Channel: this.ChannelName,
                    Message: Template.slice(0, 500),
                });
            }
        } catch (Err) {
            this.Logger.Log(LogLevel.ERROR, Err);
        }
    };
}
