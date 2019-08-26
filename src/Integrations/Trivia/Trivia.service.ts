import 'reflect-metadata';

import { Channel } from '../../Channel';
import QuestionCoordinator, { EQuestionCategory, RetryQuestionApi } from '../../Classes/QuestionCoordinator';
import Command from '../../Decorators/Command';
import MessageHandler from '../../Decorators/MessageHandler';
import { ChannelProps } from '../../test';
import Common from '../../Utils/Common';

type TriviaAnswer = 'a' | 'b' | 'c' | 'd';

class Trivia extends ChannelProps {
    protected SessionToken: string;
    protected CorrectLetter: TriviaAnswer;
    protected CorrectAnswer: string;
    protected Category: keyof typeof EQuestionCategory;

    protected TriviaKillID: NodeJS.Timeout;

    protected AcceptTime: number = 10000;
    protected Active: boolean = false;
    protected Answered: string[] = [];
    protected Scores: Record<string, number> = {};
    protected LastWinner: {
        Name: string;
        Streak: number;
    } = { Name: '', Streak: 1 };

    protected MessageFormat = 'pokiHmm %Question% pokiHmm | %Answers%';

    public constructor() {
        super();
    }

    @Command({
        Identifiers: ['trivia'],
        IncludeProtoNameAsIdentifier: false,
        Subscriber: true,
    })
    public async Trivia(): Promise<void> {
        if (this.Active === true) return;

        const { results } = await RetryQuestionApi(
            () =>
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
            this.MessageClient.Send({ Channel: this.ChannelName, Message: "Couldn't load Trivia data pepeW" });
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const DataMap: Record<string, any> = {
            '%category': Category,
            '%type%': Type,
            '%difficulty%': Difficulty,
            '%question%': Question,
            '%answers%': PossibleAnswers.map((Item, IDx) => `${Common.IndexToAlpha<TriviaAnswer>(IDx).toLocaleUpperCase()}. ${Item}`).join(' | '),
        };

        const Message = this.MessageFormat.replace(/%[^%]+%/g, Match =>
            typeof DataMap[Match.toLowerCase()] === 'undefined' ? Match : DataMap[Match.toLowerCase()],
        );

        await this.MessageClient.Send({ Channel: this.ChannelName, Message, Type: 'Trivia_Start' });

        this.Active = true;
        this.Answered = [];
        this.CorrectAnswer = CorrectAnswer;
        this.CorrectLetter = CorrectAnswerLetter;

        this.TriviaKillID = setTimeout(() => {
            this.Active = false;

            this.LastWinner = {
                Name: undefined,
                Streak: 0,
            };

            this.MessageClient.Send({
                Channel: this.ChannelName,
                Message: `Nobody got it correct! The correct answer was ${this.CorrectLetter}. ${this.CorrectAnswer}. Pepega Clap`,
            });
        }, this.AcceptTime);
    }

    @MessageHandler()
    public async ProcessTriviaAnswer(this: InstanceType<typeof Channel & Trivia>, User: string, Message: string) {
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

            this.UpdateScore(User, Points);

            this.MessageClient.Send({
                Channel: this.ChannelName,
                Message: `@${User} gets ${Points} points${StreakMessage}! You are now on ${this.Scores[User]} points! The answer was ${this.CorrectLetter}. ${this.CorrectAnswer}!`,
            });
        } else this.UpdateScore(User, -50);
    }

    public UpdateScore(User: string, Amount: number) {
        if (typeof this.Scores[User] === 'undefined') this.Scores[User] = Amount;
        else this.Scores[User] = this.Scores[User] + Amount;
    }
}

export default Trivia;
