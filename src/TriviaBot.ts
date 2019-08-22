import Logger, { Levels } from '@robinlemon/logger';
import Retry from 'async-retry';
import Bluebird from 'bluebird';
import Chalk from 'chalk';
import * as fs from 'fs-extra';
import TwitchClient from 'twitch';
import ChatClient from 'twitch-chat-client';

import Common from './Common';
import { ITokenResponse, ITokenSerialised } from './Interfaces';
import QuestionCoordinator, { EQuestionCategory, EStatusCode } from './QuestionCoordinator';
import { SchemaType } from './Schema';

type FilterFunc<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => void ? K : never;
}[keyof T];

type EventParams<K extends FilterFunc<ChatClient>> = Parameters<ChatClient[K]>[0];

type GetPublicMethodsFromClass<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => void ? T[K] : never;
}[keyof T];

type RemovePromise<T> = T extends Promise<infer R> ? R : never;

type ClassMethods<T> = GetPublicMethodsFromClass<T>;
type ClassMethodReturnPromises<T> = ReturnType<ClassMethods<T>>;
type ClassMethodReturnTypes<T> = RemovePromise<ClassMethodReturnPromises<T>>;

interface ISession {
    SessionToken: string;
    CorrectLetter: string;
    CorrectAnswer: string;
    Active: boolean;
    Category: keyof typeof EQuestionCategory;
    AcceptTime: number;
    TriviaKillID: NodeJS.Timeout;
    Answered: string[];
    LastWinner: {
        Name: string;
        Streak: number;
    };
    Scores: Record<string, number>;
}

export default class TriviaBot {
    private TwitchClient: TwitchClient;
    private ChatClient: ChatClient;

    private Channels: string[] = [];
    private CommandPrefix: string;
    private MessageFormat: string;

    private TokenInfo: ITokenSerialised;
    private SessionMap: Record<string, ISession>;

    private LastSelfMessage: number = 0;

    private Logger = new Logger(this.constructor.name);

    public SetChannels = (Channels: string[]) => (this.Channels = Channels);
    public AddChannels = (Channels: string[]) => (this.Channels = [...this.Channels, ...Channels]);

    public Initialise = async (Environment: SchemaType) => {
        this.Logger.log('Loaded Environment');
        this.CommandPrefix = Environment.CommandPrefix;
        this.MessageFormat = Environment.QuestionFormat;
        this.Channels = Environment.ChannelsList.split(',').map(k => k.trim().toLocaleLowerCase());
        this.SessionMap = this.Channels.reduce<Record<string, ISession>>(
            (Current, ChannelName) =>
                Object.assign<Record<string, ISession>, Record<string, Partial<ISession>>>(Current, {
                    [ChannelName]: {
                        Active: false,
                        AcceptTime: Environment.TriviaTime,
                        Answered: [],
                        LastWinner: {
                            Name: '',
                            Streak: 1,
                        },
                        Scores: {},
                    },
                }),
            {},
        );

        this.Logger.log('Initialising Twitch API');
        this.TokenInfo = JSON.parse(await fs.readFile('./tokens.json', 'UTF-8'));
        this.TwitchClient = await TwitchClient.withCredentials(Environment.ClientID, this.TokenInfo.accessToken, undefined, {
            clientSecret: Environment.ClientSecret,
            refreshToken: this.TokenInfo.refreshToken,
            expiry: this.TokenInfo.expiryTimestamp === null ? null : new Date(this.TokenInfo.expiryTimestamp),
            onRefresh: this.RefreshToken,
        });

        this.ChatClient = await ChatClient.forTwitchClient(this.TwitchClient);
        this.SetupChat();
    };

    private RefreshToken = async ({ accessToken, refreshToken, expiryDate }: ITokenResponse) => {
        this.Logger.log('Refreshed OAuth Token');

        await fs.writeFile(
            './tokens.json',
            JSON.stringify(
                {
                    accessToken,
                    refreshToken,
                    expiryTimestamp: expiryDate === null ? null : expiryDate.getTime(),
                },
                null,
                4,
            ),
            'UTF-8',
        );

        this.Logger.log('Saved OAuth Token');
    };

    private SetupChat = async () => {
        this.Logger.log('Connecting To Twitch IRC');
        await this.ChatClient.connect();
        this.Logger.log('Connected, Waiting For Registration');
        await this.ChatClient.waitForRegistration();
        this.Logger.log('Successfully Authenticated to Twitch IRC');
        await this.JoinChannels();

        this.SetupEvents();
    };

    private JoinChannels = async () =>
        await Bluebird.map(
            this.Channels,
            async Channel => {
                await this.ChatClient.join(Channel);
                this.Logger.log(`Joined ${Channel}'s channel.`);
            },
            { concurrency: 10 },
        );

    private SetupEvents = () => {
        this.ChatClient.onPrivmsg(this.PrivateMessageHandler);
    };

    private PrivateMessageHandler: EventParams<'onPrivmsg'> = async (Channel, User, Message, _Raw) => {
        if (this.Channels.includes(Channel) === false) return;

        const ColouredCommands = Message.replace(/^\s*(\$\w+)/g, Message => Chalk.redBright(Message));
        const ColouredNames = ColouredCommands.replace(/(\@[^\s]+)/g, Message => Chalk.greenBright(Message));

        const WithTag = `@${User}`;
        const IsAuthor = WithTag === '@robinlemonz';

        let PrintName = WithTag;

        if (IsAuthor) PrintName = Chalk.cyanBright(WithTag);
        if (_Raw.userInfo.isSubscriber) PrintName = Chalk.blueBright(WithTag);
        if (_Raw.userInfo.isMod) PrintName = Chalk.greenBright(WithTag);
        if (['global_mod', 'staff'].includes(_Raw.userInfo.userType)) PrintName = Chalk.yellowBright(WithTag);
        if ('admin' === _Raw.userInfo.userType) PrintName = Chalk.magentaBright(WithTag);

        const DisplayName = Channel.slice(1).toLowerCase();

        this.Logger.log(`[${DisplayName}] ${PrintName} -> ${ColouredNames}`, Levels.DEBUG);

        if (IsAuthor) this.LastSelfMessage = Date.now();

        const Split = Message.split(' ');
        const IsCommand = Message.charAt(0) === this.CommandPrefix;
        const Command = Split[0] ? Split[0].substr(this.CommandPrefix.length) : '';
        const Allowed = _Raw.userInfo.isMod || _Raw.userInfo.isSubscriber || ['mod', 'global_mod', 'admin', 'staff'].includes(_Raw.userInfo.userType);

        if (IsCommand && Allowed) {
            if (Command === 'jay1cee') this.AddToReplyQueueIterator(Channel, `@jay1cee T OMEGALUL R Y`);
            if (Command === 'trivia' && this.SessionMap[Channel].Active === false) this.BeginTrivia(Channel);
        } else if (this.SessionMap[Channel].Active) {
            if (this.SessionMap[Channel].Answered.includes(User)) return;

            const TheirAnswer = Message.trim().toLowerCase();
            const RequiredAnswer = this.SessionMap[Channel].CorrectLetter.trim().toLowerCase();

            if ('abcd'.indexOf(TheirAnswer) > -1) this.SessionMap[Channel].Answered.push(User);
            else return;

            if (TheirAnswer === RequiredAnswer) {
                clearTimeout(this.SessionMap[Channel].TriviaKillID);

                this.SessionMap[Channel].Active = false;

                if (this.SessionMap[Channel].LastWinner.Name === User) this.SessionMap[Channel].LastWinner.Streak++;
                else
                    this.SessionMap[Channel].LastWinner = {
                        Name: User,
                        Streak: 1,
                    };

                let StreakMessage = this.SessionMap[Channel].LastWinner.Streak > 1 ? ' on a ' : '';
                let Points = 100;

                if (this.SessionMap[Channel].LastWinner.Streak === 2) {
                    StreakMessage += 'double streak';
                    Points += 50;
                }

                if (this.SessionMap[Channel].LastWinner.Streak === 3) {
                    StreakMessage += 'triple streak';
                    Points += 75;
                }

                if (this.SessionMap[Channel].LastWinner.Streak === 4) {
                    StreakMessage += 'mega streak';
                    Points += 100;
                }

                if (this.SessionMap[Channel].LastWinner.Streak >= 5 && this.SessionMap[Channel].LastWinner.Streak < 10) {
                    StreakMessage += 'ultra streak';
                    Points += 150;
                }

                if (this.SessionMap[Channel].LastWinner.Streak >= 10) {
                    StreakMessage += 'rampage';
                    Points += 200;
                }

                this.UpdateScore(Channel, User, Points);

                await this.AddToReplyQueueIterator(
                    Channel,
                    `@${User} gets ${Points} points${StreakMessage}! You are now on ${this.SessionMap[Channel].Scores[User]} points!. The answer was ${this.SessionMap[Channel].CorrectLetter}. ${this.SessionMap[Channel].CorrectAnswer}!`,
                );
            } else this.UpdateScore(Channel, User, -50);
        }
    };

    private UpdateScore = (Channel: string, User: string, Amount: number) => {
        if (typeof this.SessionMap[Channel].Scores[User] === 'undefined') this.SessionMap[Channel].Scores[User] = Amount;
        else this.SessionMap[Channel].Scores[User] = this.SessionMap[Channel].Scores[User] + Amount;
    };

    private AddToReplyQueueIterator = async (Channel: string, Message: string) => {
        const Diff = this.GetTimeDiff(this.LastSelfMessage);
        const RequiredWaitTime = 5000;
        const Delay = RequiredWaitTime - Diff;

        if (Message.length > 500) {
            this.Logger.log(`Message Too Long: Received ${Message.length} Characters`, Levels.ERROR);
            return;
        }

        if (Diff < RequiredWaitTime) await this.FakeWait(Delay);

        this.ChatClient.say(Channel, Message);
        this.LastSelfMessage = Date.now();
    };

    private ShuffleArray = <T>(List: T[]): T[] => {
        for (let i = List.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [List[i], List[j]] = [List[j], List[i]];
        }

        return List;
    };

    private IDxToAlpha = (Offset: number) => String.fromCharCode(65 + Offset);

    private BeginTrivia = async (Channel: string) => {
        const { SessionToken } = this.SessionMap[Channel];
        const { results } = await this.RetryQuestionApi(
            Channel,
            () =>
                QuestionCoordinator.GetQuestions(SessionToken, {
                    amount: 1,
                    difficulty: 'easy',
                    encode: 'base64',
                    type: 'multiple',
                    ...(this.SessionMap[Channel].Category !== undefined &&
                        EQuestionCategory[this.SessionMap[Channel].Category] !== EQuestionCategory['Any Category'] && {
                            category: EQuestionCategory[this.SessionMap[Channel].Category],
                        }),
                }),
            true,
        );

        if (results.length === 0) {
            this.AddToReplyQueueIterator(Channel, "Couldn't load Trivia data pepeW");
            return;
        }

        const Category = Common.DecodeBase64(results[0].category);
        const Type = Common.DecodeBase64(results[0].type);
        const Difficulty = Common.DecodeBase64(results[0].difficulty);
        const Question = Common.DecodeBase64(results[0].question);
        const CorrectAnswer = Common.DecodeBase64(results[0].correct_answer);
        const IncorrectAnswers = results[0].incorrect_answers.map(Common.DecodeBase64);

        const PossibleAnswers = [CorrectAnswer, ...IncorrectAnswers];
        const MixedAnswers = this.ShuffleArray(PossibleAnswers);

        const CorrectAnswerIDx = MixedAnswers.indexOf(CorrectAnswer);
        const CorrectAnswerLetter = this.IDxToAlpha(CorrectAnswerIDx);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const DataMap: Record<string, any> = {
            '%category': Category,
            '%type%': Type,
            '%difficulty%': Difficulty,
            '%question%': Question,
            '%answers%': MixedAnswers.map((Item, IDx) => `${this.IDxToAlpha(IDx)}. ${Item}`).join(' | '),
        };

        const Message = this.MessageFormat.replace(/%[^%]+%/g, Match =>
            typeof DataMap[Match.toLowerCase()] === 'undefined' ? Match : DataMap[Match.toLowerCase()],
        );

        await this.AddToReplyQueueIterator(Channel, Message);

        this.SessionMap[Channel].Active = true;
        this.SessionMap[Channel].Answered = [];
        this.SessionMap[Channel].CorrectAnswer = CorrectAnswer;
        this.SessionMap[Channel].CorrectLetter = CorrectAnswerLetter;

        this.SessionMap[Channel].TriviaKillID = setTimeout(() => {
            this.SessionMap[Channel].Active = false;

            this.SessionMap[Channel].LastWinner = {
                Name: undefined,
                Streak: 0,
            };

            this.AddToReplyQueueIterator(
                Channel,
                `Nobody got it correct! The correct answer was ${this.SessionMap[Channel].CorrectLetter}. ${this.SessionMap[Channel].CorrectAnswer}. Pepega Clap`,
            );
        }, this.SessionMap[Channel].AcceptTime);
    };

    private GetTimeDiff = (Timestamp: number) => Date.now() - Timestamp;

    private FakeWait = (ms: number) => new Promise(Resolve => setTimeout(Resolve, ms));

    private RetryQuestionApi = <T extends ClassMethodReturnTypes<typeof QuestionCoordinator>>(
        Channel: string,
        Fn: () => Promise<T>,
        forever: boolean = false,
    ): Promise<T> =>
        Retry(
            async () => {
                const Response = await Fn();

                switch (Response.response_code) {
                    /**
                     * Success - Returned results successfully.
                     */
                    case EStatusCode.Success:
                        return Response;

                    /**
                     * No Results - Could not return results.
                     *
                     * The API doesn't have enough questions for your query. (Ex. Asking for 50 Questions in a Category that only has 20.)
                     */
                    case EStatusCode.NoResults:
                        this.SessionMap[Channel].SessionToken = (await this.RetryQuestionApi(
                            Channel,
                            () => QuestionCoordinator.ResetSession(this.SessionMap[Channel].SessionToken),
                            true,
                        )).token;
                        throw new Error('Token Reset');

                    /**
                     * Invalid Parameter - Contains an invalid parameter.
                     *
                     * Arguments passed in aren't valid. (Ex. Amount = Five)
                     */
                    case EStatusCode.InvalidParameter:
                        throw new Error('Invalid Parameters');

                    /**
                     * Token Not Found - Session Token does not exist.
                     */
                    case EStatusCode.TokenNotFound:
                        throw new Error('Token Not Specified');

                    /**
                     * Token Empty - Session Token has returned all possible questions for the specified query.
                     *
                     * Resetting the Token is necessary.
                     */
                    case EStatusCode.TokenEmpty:
                        this.SessionMap[Channel].SessionToken = (await this.RetryQuestionApi(
                            Channel,
                            () => QuestionCoordinator.ResetSession(this.SessionMap[Channel].SessionToken),
                            true,
                        )).token;
                        throw new Error('Token Reset');
                }

                throw new Error('Malformed Response');
            },
            {
                onRetry: (Err, Attempt) => this.Logger.log(`Attempt ${Attempt}: ${Err}`, Levels.WARN),
                forever,
                retries: 10,
            },
        );
}
