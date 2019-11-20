import 'reflect-metadata';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Logger, LogLevel } from '@robinlemon/logger';

import { MessageQueueDispatcher } from '../../Classes/MessageQueueDispatcher';
import { Command, CommandType } from '../../Decorators/Command';
import { MessageHandler } from '../../Decorators/MessageHandler';
import { Common } from '../../Utils/Common';
import { Integration } from '../index';
import { EQuestionCategory, IQuestionsResponse, QuestionCoordinator, RetryQuestionApi } from './Classes/QuestionCoordinator';
import { TriviaUser } from './Trivia.model';

type TriviaAnswer = 'a' | 'b' | 'c' | 'd';

export class Trivia extends Integration {
    protected SessionToken!: string;
    protected CorrectLetter!: TriviaAnswer;
    protected CorrectAnswer!: string;
    protected Category!: keyof typeof EQuestionCategory;

    protected TriviaKillID!: NodeJS.Timeout;

    protected AcceptTime = 10000;
    protected Active = false;
    protected Answered: string[] = [];
    protected Scores: Record<string, number> = {};
    protected LastWinner: {
        Name: string;
        Streak: number;
    } = { Name: '', Streak: 1 };

    protected MessageFormat = 'Okey %Question% Okey | %Answers%';

    public constructor(protected ChannelName: string, protected MessageHandler: MessageQueueDispatcher, protected Logger: Logger) {
        super();
    }

    public get Identifier(): string {
        return this.constructor.name;
    }

    @Command({
        Identifiers: ['score'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Score: CommandType = async (_Context, Username, PlayerName?: string): Promise<void> => {
        try {
            const IsUserProvided = typeof PlayerName !== 'undefined' && PlayerName;
            const Player = await TriviaUser.findOne({ Username: IsUserProvided ? PlayerName : Username });

            if (Player !== null)
                this.MessageHandler.Send({
                    Channel: this.ChannelName,
                    Message: `@${IsUserProvided ? PlayerName : Username} has ${Player.Score} points! ${Player.Score > 0 ? 'FeelsOkayMan Clap' : 'FeelsBadMan'}`,
                });
            else
                this.MessageHandler.Send({
                    Channel: this.ChannelName,
                    Message: `@${Username} I couldn't find ${IsUserProvided ? `the score for the user ${PlayerName}` : 'your score'} FeelsBadMan`,
                });
        } catch (Err) {
            this.Logger.Log(LogLevel.ERROR, Err);
            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `@${Username} Something went wrong FeelsDankMan`,
            });
        }
    };

    @Command({
        Identifiers: ['leaderboard', 'lb'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Leaderboard: CommandType = async (_Context, Username, PlayerName): Promise<void> => {
        try {
            if (typeof PlayerName !== 'undefined' && PlayerName) {
                /**
                 * Return if the @ symbol is not at the beginning of one exists.
                 */
                if (PlayerName.includes('@') && PlayerName.indexOf('@') !== 0) return;

                /**
                 * Return if more than one @ symbol in name.
                 */
                const AtSymbolMatch = PlayerName.match(/@/g);
                if (AtSymbolMatch !== null && AtSymbolMatch.length > 1) return;

                /**
                 * Remove @ symbol if one exists.
                 */
                if (PlayerName.startsWith('@')) PlayerName = PlayerName.replace(/@/g, '');

                const Players = await TriviaUser.find().sort({ Score: 'descending' });

                if (Players !== null) {
                    const Rank = Players.findIndex(Player => Player.Username === PlayerName);

                    if (Rank > -1) {
                        let Emoji = 'Pepega Clap';

                        if (Rank < 5) Emoji = 'FeelsOkayMan';
                        if (Rank === 0) Emoji = '5Head 🍷';

                        this.MessageHandler.Send({
                            Channel: this.ChannelName,
                            Message: `@${Username} ${PlayerName} is rank ${Rank + 1} on the leaderboard! ${Emoji}`,
                        });
                    } else {
                        this.MessageHandler.Send({
                            Channel: this.ChannelName,
                            Message: `@${Username} ${PlayerName} does not have a score yet! FeelsBadMan`,
                        });
                    }
                } else {
                    this.MessageHandler.Send({
                        Channel: this.ChannelName,
                        Message: `@${Username} Nobody has a score yet! FeelsBadMan`,
                    });
                }
            } else {
                const Players = await TriviaUser.find()
                    .sort({ Score: 'descending' })
                    .limit(5);

                if (Players !== null && Players.length > 0) {
                    const Emoji = ['1⃣ ', '2⃣ ', '3⃣ ', '4⃣ ', '5⃣ '];
                    const Message = Players.map((Player, IDx) => `${Emoji[IDx]} ${Player.Username} (${Player.Score})`).join(' ');

                    this.MessageHandler.Send({
                        Channel: this.ChannelName,
                        Message,
                    });
                } else
                    this.MessageHandler.Send({
                        Channel: this.ChannelName,
                        Message: `@${Username} Nobody has a score yet! FeelsBadMan`,
                    });
            }
        } catch (Err) {
            this.Logger.Log(LogLevel.ERROR, Err);
            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `@${Username} Something went wrong FeelsDankMan`,
            });
        }
    };

    @Command({
        Identifiers: ['trivia'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public Trivia: CommandType = async (): Promise<void> => {
        if (this.Active === true) return;

        this.Active = true;

        const { results } = await RetryQuestionApi(
            (): Promise<IQuestionsResponse<'base64'>> =>
                QuestionCoordinator.GetQuestions(this.SessionToken, {
                    amount: 1,
                    difficulty: 'easy',
                    encode: 'base64',
                    type: 'multiple',
                }),
            true,
            this.SessionToken,
        );

        if (results.length === 0) {
            this.MessageHandler.Send({ Channel: this.ChannelName, Message: "Couldn't load Trivia data pepeW" });
            return;
        }

        const Category = Common.DecodeBase64(results[0].category);
        const Type = Common.DecodeBase64(results[0].type);
        const Difficulty = Common.DecodeBase64(results[0].difficulty);
        const Question = Common.DecodeBase64(results[0].question);
        const CorrectAnswer = Common.DecodeBase64(results[0].correct_answer);
        const IncorrectAnswers = results[0].incorrect_answers.map(Common.DecodeBase64);

        const PossibleAnswers = [...IncorrectAnswers];
        const CorrectAnswerIDx = Common.RandomInt(0, 3);
        const CorrectAnswerLetter = Common.IndexToAlpha<TriviaAnswer>(CorrectAnswerIDx);

        PossibleAnswers.splice(CorrectAnswerIDx, 0, CorrectAnswer);

        const DataMap: Record<string, string> = {
            '%answers%': PossibleAnswers.map((Item, IDx): string => `${Common.IndexToAlpha<TriviaAnswer>(IDx).toLocaleUpperCase()}. ${Item}`).join(' | '),
            '%category%': Category,
            '%difficulty%': Difficulty,
            '%question%': Question,
            '%type%': Type,
        };

        const Message = this.MessageFormat.replace(/%[^%]+%/g, (Match: string): string =>
            typeof DataMap[Match.toLowerCase()] === 'undefined' ? Match : DataMap[Match.toLowerCase()],
        );

        await this.MessageHandler.Send({ Channel: this.ChannelName, Message, Type: 'Trivia_Start' });

        this.Answered = [];
        this.CorrectAnswer = CorrectAnswer;
        this.CorrectLetter = CorrectAnswerLetter;

        this.TriviaKillID = setTimeout((): void => {
            this.Active = false;

            this.LastWinner = {
                Name: '',
                Streak: 0,
            };

            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `Nobody got it correct! The correct answer was ${this.CorrectLetter}. ${this.CorrectAnswer}. Pepega Clap`,
            });
        }, this.AcceptTime);
    };

    @MessageHandler()
    public ProcessTriviaAnswer = async (User: string, Message: string): Promise<void> => {
        if (
            this.Active === false ||
            'abcd'.indexOf(Message.toLocaleLowerCase()) === -1 ||
            Message.toLocaleLowerCase() === 'abcd' ||
            this.Answered.includes(User)
        )
            return;
        else this.Answered.push(User);

        if ((Message.toLocaleLowerCase() as TriviaAnswer) === this.CorrectLetter) {
            clearTimeout(this.TriviaKillID);

            this.Active = false;

            if (this.LastWinner.Name === User) this.LastWinner.Streak++;
            else
                this.LastWinner = {
                    Name: User,
                    Streak: 1,
                };

            let StreakMessage = this.LastWinner.Streak > 1 ? ' on a ' : '';
            let Points = 100;

            if (this.LastWinner.Streak === 2) {
                StreakMessage += 'double streak';
                Points += 50;
            }

            if (this.LastWinner.Streak === 3) {
                StreakMessage += 'triple streak';
                Points += 75;
            }

            if (this.LastWinner.Streak === 4) {
                StreakMessage += 'mega streak';
                Points += 100;
            }

            if (this.LastWinner.Streak >= 5 && this.LastWinner.Streak < 10) {
                StreakMessage += 'ultra streak';
                Points += 150;
            }

            if (this.LastWinner.Streak >= 10) {
                StreakMessage += 'rampage';
                Points += 200;
            }

            const NewPoints = await this.UpdateScore(User, Points);

            if (NewPoints === undefined) {
                this.MessageHandler.Send({
                    Channel: this.ChannelName,
                    Message: `@${User} gets ${Points} points${StreakMessage}! The answer was ${this.CorrectLetter}. ${this.CorrectAnswer}! There was an internal error updating your profile score though FeelsBadMan`,
                });
            } else
                this.MessageHandler.Send({
                    Channel: this.ChannelName,
                    Message: `@${User} gets ${Points} points${StreakMessage}! You are now on ${NewPoints} points! The answer was ${this.CorrectLetter}. ${this.CorrectAnswer}! 5Head 🍷`,
                });
        } else this.UpdateScore(User, -50);
    };

    private async UpdateScore(Username: string, Amount: number): Promise<number | void> {
        try {
            const Player = await TriviaUser.findOneAndUpdate(
                { Username },
                { Username },
                {
                    new: true,
                    setDefaultsOnInsert: true,
                    upsert: true,
                },
            );

            await Player.UpdateScore(Amount);
            return Player.Score + Amount;
        } catch (Err) {
            this.Logger.Log(LogLevel.ERROR, Err);
            this.MessageHandler.Send({
                Channel: this.ChannelName,
                Message: `@${Username} Something went wrong FeelsDankMan`,
            });
        }
    }
}
