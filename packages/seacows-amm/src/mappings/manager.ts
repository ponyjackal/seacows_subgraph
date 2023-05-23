import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  SeacowsPositionManager as SeacowsPositionManagerContract,
  PairCreated,
  Transfer,
  TransferValue
} from "../../generated/SeacowsPositionManager/SeacowsPositionManager";
import { Token as TokenContract } from "../../generated/SeacowsPositionManager/Token";
import { Collection as CollectionContract } from "../../generated/SeacowsPositionManager/Collection";
import { Collection, Pool, Token, Position, User } from "../../generated/schema";
import { Pool as PoolTemplate, Collection as CollectionTemplate } from "../../generated/templates";
import { ZERO_BI } from "../constants";

export function handleTransfer(event: Transfer): void {
  const _from = event.params._from;
  const _to = event.params._to;
  const _tokenId = event.params._tokenId;
  const _pair = event.address;

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
  position.slot = manager.slotOf(_tokenId);
  position.pool = _pair.toHexString();
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
  const _pair = event.params.pair;

  let pool = new Pool(_pair.toHexString());

  let token = Token.load(_token.toHexString());
  if (token === null) {
    const tokenContract = TokenContract.bind(_token);

    token = new Token(_token.toHexString());
    token.name = tokenContract.name();
    token.symbol = tokenContract.symbol();
    token.decimals = BigInt.fromI32(tokenContract.decimals());
    token.txCount = ZERO_BI;
  }

  let collection = Collection.load(_collection.toHexString());
  if (collection === null) {
    const collectionContract = CollectionContract.bind(_collection);

    collection = new Collection(_collection.toHexString());
    collection.name = collectionContract.name();
    collection.symbol = collectionContract.symbol();
    collection.txCount = ZERO_BI;
  }

  pool.token = token.id;
  pool.collection = collection.id;
  pool.liquidity = ZERO_BI;
  pool.fee = _fee;
  pool.slot = _slot;
  pool.txCount = ZERO_BI;

  pool.save();
  PoolTemplate.create(_pair);
  token.save();
  collection.save();
  CollectionTemplate.create(_collection);
}
