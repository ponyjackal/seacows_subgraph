import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  SeacowsPositionManager as SeacowsPositionManagerContract,
  PairCreated,
  Transfer,
  TransferValue
} from "../../generated/SeacowsPositionManager/SeacowsPositionManager";
import { Token as TokenContract } from "../../generated/SeacowsPositionManager/Token";
import { Collection as CollectionContract } from "../../generated/SeacowsPositionManager/Collection";
import { Collection, Pair, Token, Position, User } from "../../generated/schema";
import { ADDRESS_ZERO } from "../constants";

export function handleTransfer(event: Transfer): void {
  const _from = event.params._from;
  const _to = event.params._to;
  const _tokenId = event.params._tokenId;

  let fromUser = User.load(_from.toHexString());
  if (fromUser === null) {
    fromUser = new User(_from.toHexString());
    fromUser.save();
  }

  let toUser = User.load(_to.toHexString());
  if (toUser === null) {
    toUser = new User(_to.toHexString()) as User;
    toUser.save();
  }

  let position = Position.load(_tokenId.toHexString());
  if (position === null) {
    position = new Position(_tokenId.toString());
  }
  const manager = SeacowsPositionManagerContract.bind(event.address);
  position.owner = manager.ownerOf(_tokenId).toHexString();
  position.liquidity = manager.balanceOf1(_tokenId);
  position.save();
}

export function handleTransferValue(event: TransferValue): void {
  const _fromTokenId = event.params._fromTokenId;
  const _toTokenId = event.params._toTokenId;

  let fromPosition = Position.load(_fromTokenId.toHexString());
  if (fromPosition !== null) {
    const manager = SeacowsPositionManagerContract.bind(event.address);
    fromPosition.liquidity = manager.balanceOf1(_fromTokenId);
    fromPosition.save();
  }
  let toPosition = Position.load(_toTokenId.toHexString());
  if (toPosition !== null) {
    const manager = SeacowsPositionManagerContract.bind(event.address);
    toPosition.liquidity = manager.balanceOf1(_toTokenId);
    toPosition.save();
  }
}

export function handlePairCreated(event: PairCreated): void {
  const _token = event.params.token;
  const _collection = event.params.collection;
  const _fee = event.params.fee;
  const _slot = event.params.slot;

  let pair = new Pair(event.params.pair.toHexString());

  let token = Token.load(_token.toHexString());
  if (token === null) {
    const tokenContract = TokenContract.bind(_token);

    token = new Token(_token.toHexString());
    token.name = tokenContract.name();
    token.symbol = tokenContract.symbol();
    token.decimals = BigInt.fromI32(tokenContract.decimals());
    token.save();
  }

  let collection = Collection.load(_collection.toHexString());
  if (collection === null) {
    const collectionContract = CollectionContract.bind(_collection);

    collection = new Collection(_collection.toHexString());
    collection.name = collectionContract.name();
    collection.symbol = collectionContract.symbol();
    collection.save();
  }

  pair.token = token.id;
  pair.collection = collection.id;
  pair.fee = _fee;
  pair.slot = _slot;
  pair.save();
}
