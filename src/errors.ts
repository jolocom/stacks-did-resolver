export enum DIDParseErrorCodes {
    InvalidVersionByte = 'InvalidVersionByte',
    InvalidAddress = 'InvalidAddress,',
    InvalidTransactionId = 'InvalidTransactionId,',
    InvalidNSI = 'InvalidNSI',
    IncorrectMethodIdentifier = 'IncorrectMethodIdentifier,',
}

export enum DIDResolutionErrorCodes {
    InvalidMigrationTx = 'InvalidMigrationTx',
    OwnerMissmatch = 'OwnerMissmatch', // TODO Elaborate on this?
    InvalidAnchorTx = 'InvalidAnchorTx',
    MissingZoneFile = 'MissingZoneFile',
    InvalidZonefile = 'InvalidZonefile',
    InvalidSignedProfileToken = 'InvalidSignedProfileToken',
    DIDExpired = 'DIDExpired',
    DIDDeactivated = 'DIDDeactivated',
}

export const ErrorMessages: {[key in DIDResolutionErrorCodes & DIDParseErrorCodes]: {
    code: string,
    message: string
}} = {
    [DIDResolutionErrorCodes.DIDDeactivated]: {}
}

export class DIDResolutionError extends Error {
    public constructor(code: DIDResolutionErrorCodes, message?: string) {
        super(`${code}${message ? ': ' + message: ''}`)
    }
}

export class DIDParseError extends Error {
    public constructor(code: DIDParseErrorCodes, message?: string) {
        super(`${code}${message ? ': ' + message: ''}`)
    }
}
