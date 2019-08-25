import Logger from '@robinlemon/logger';

import { DispatchClient } from './Classes/MessageQueueDispatcher';

/* Channel Definition */
export abstract class ChannelProps extends DispatchClient {
    protected ChannelName: string;
    protected Logger: Logger;
}
