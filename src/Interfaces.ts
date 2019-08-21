interface ITokenCommon {
    accessToken: string;
    refreshToken: string;
}

export interface ITokenResponse extends ITokenCommon {
    expiryDate: Date;
}

export interface ITokenSerialised extends ITokenCommon {
    expiryTimestamp: number;
}
