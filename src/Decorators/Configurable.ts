import { ChannelProps } from '../test';
import { ClassMethodNames } from '../Utils/Common';

export default (Value: boolean = false): any => {
    return <T extends ChannelProps>(Target: T, PropertyKey: ClassMethodNames<T>, Descriptor: TypedPropertyDescriptor<T[ClassMethodNames<T>]>) =>
        (Descriptor.configurable = Value);
};
