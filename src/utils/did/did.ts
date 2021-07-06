import {
  DID_METHOD_PREFIX,
  BNS_CONTRACT_DEPLOY_TXID,
  versionByteToDidType,
} from "../../constants"
import { DidType, StacksNetworkDeployment, StacksV2DID } from "../../types"
import { stripHexPrefixIfPresent } from "../general"
import { last, split } from "ramda"
import { Right, Left, Either } from "monet"
import { c32addressDecode } from "c32check/lib/address"
import { DIDParseError, DIDParseErrorCodes } from "../../errors"

const isC32EncodedAddress = (address: string) => {
  try {
    c32addressDecode(address)
    return true
  } catch {
    return false
  }
}

/*
 * Helper used to check if the DID's NSI includes a valid
 * Stacks transaction ID. Will ensure the passed value is 32
 * bytes long and hex encoded
 */

const isStacksTxId = (txId: string) => {
  if (!txId) {
    return false
  }

  const toTest = stripHexPrefixIfPresent(txId)
  const regexp = /^[0-9a-fA-F]+$/

  if (toTest.length !== 64 || !regexp.test(toTest)) {
    return false
  }

  return true
}

/*
 *
 */

export const parseStacksV2DID = (did: string): Either<Error, StacksV2DID> => {
  if (!did.startsWith(DID_METHOD_PREFIX + ":")) {
    return Left(
      new DIDParseError(
        DIDParseErrorCodes.IncorrectMethodIdentifier,
        `DID must start with ${DID_METHOD_PREFIX}`
      )
    )
  }

  const nsi = last(split(":", did))

  if (!nsi) {
    return Left(new DIDParseError(
      DIDParseErrorCodes.InvalidNSI,
      'DID NSI is empty'
    ))
  }

  const [address, anchorTxId] = split("-", nsi)

  if (!address || !isC32EncodedAddress(address)) {
    return Left(
      new DIDParseError(
        DIDParseErrorCodes.InvalidAddress,
        'DID must encode a valid Stacks address in the NSI'
      )
    )
  }

  if (!anchorTxId || !isStacksTxId(anchorTxId)) {
    return Left(
      new DIDParseError(
        DIDParseErrorCodes.InvalidTransactionId,
        'DID must encode a valid Stacks transaction ID in the NSI'
      ),
    )
  }

  return getDidType(address).map((metadata) => ({
    prefix: DID_METHOD_PREFIX,
    address,
    metadata,
    anchorTxId,
  }))
}

export const encodeStacksV2Did = (did: {
  address: string
  anchorTxId: string
}): Either<Error, string> => {
  if (!isC32EncodedAddress(did.address)) {
    return Left(new DIDParseError(DIDParseErrorCodes.InvalidAddress))
  }

  if (!isStacksTxId(did.anchorTxId)) {
    return Left(
      new DIDParseError(DIDParseErrorCodes.InvalidTransactionId)
    )
  }

  return Right(
    `${DID_METHOD_PREFIX}:${did.address}-${stripHexPrefixIfPresent(
      did.anchorTxId
    )}`
  )
}

export const isMigratedOnChainDid = (did: string | StacksV2DID) => {
  if (typeof did === "string") {
    return parseStacksV2DID(did).map(({ anchorTxId }) => {
      Object.values(BNS_CONTRACT_DEPLOY_TXID).includes(anchorTxId)
    })
  }
  return Object.values(BNS_CONTRACT_DEPLOY_TXID).includes(did.anchorTxId)
}

/**
 * Helper function which parses a c32 encoded address and determines whether the address
 * corresponds to an on-chain DID or an off-chain DID (depending on the AddressVersion)
 */

const getDidType = (
  addr: string
): Either<Error, { type: DidType; deployment: StacksNetworkDeployment }> => {
  const [versionByte, _] = c32addressDecode(addr)
  const didTypeAndNetwork = versionByteToDidType[versionByte]

  if (!didTypeAndNetwork) {
    return Left(
      new DIDParseError(
        DIDParseErrorCodes.InvalidVersionByte,
      )
    )
  }

  return Right(didTypeAndNetwork)
}
