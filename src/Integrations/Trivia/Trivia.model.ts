import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose';

class Player {
    @prop({ maxlength: 64, required: true, unique: true })
    public Username!: string;

    @prop({ default: 0 })
    public Score!: number;

    public UpdateScore(this: DocumentType<Player>, Amount: number): void {
        this.Score += Amount;
        this.save();
    }
}

export default getModelForClass(Player);
