import { instanceMethod, InstanceType, prop, Typegoose } from 'typegoose';

class Player extends Typegoose {
    @prop({ unique: true, maxlength: 64, required: true })
    public Username!: string;

    @prop({ default: 0 })
    public Score: number;

    @instanceMethod
    public UpdateScore(this: InstanceType<Player>, Amount: number) {
        this.Score += Amount;
        this.save();
    }
}

export default new Player().getModelForClass(Player);
