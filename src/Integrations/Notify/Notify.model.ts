import { getModelForClass, prop } from '@typegoose/typegoose';

class Notifications {
    @prop({ maxlength: 64, required: true })
    public From!: string;

    @prop({ maxlength: 64, required: true, unique: true })
    public To!: string;

    @prop({ required: true })
    public Issued!: number;

    @prop({ maxlength: 500, required: true })
    public Message!: string;
}

export default getModelForClass(Notifications);
