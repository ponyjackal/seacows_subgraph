import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  SeacowsPositionManager as SeacowsPositionManagerContract,
  PairCreated,
  Transfer,
  TransferValue
} from "../../generated/SeacowsPositionManager/SeacowsPositionManager";
import { Pool as PoolContract } from "../../generated/SeacowsPositionManager/Pool";
import { Token as TokenContract } from "../../generated/SeacowsPositionManager/Token";
import { Collection as CollectionContract } from "../../generated/SeacowsPositionManager/Collection";
import { Collection, Pool, Slot, Token, Position, User, SeacowsPositionManager } from "../../generated/schema";
import { Pool as PoolTemplate, Collection as CollectionTemplate } from "../../generated/templates";
import { ZERO_BI, ADDRESS_ZERO, ZERO_BD } from "../constants";
import { getCurrentPrice } from "../utils";

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
  position.slot = manager.slotOf(_tokenId);

  // TODO: fetch slot from contract when contract redeployed
  let slot = Slot.load(position.slot.toString());
  if (slot !== null) {
    position.pool = slot.pool;
  }
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

  let manager = SeacowsPositionManager.load(event.address.toHexString());
  if (manager === null) {
    manager = new SeacowsPositionManager(event.address.toHexString());
    manager.poolCount = ZERO_BI;
  }
  manager.poolCount = manager.poolCount.plus(BigInt.fromI32(1));

  let pool = new Pool(_pair.toHexString());

  let slot = new Slot(_slot.toString());
  slot.pool = pool.id;
  slot.slot = _slot;

  const managerContract = SeacowsPositionManagerContract.bind(event.address);

  let position = Position.load(managerContract.tokenOf(_pair).toString());
  if (position === null) {
    position = new Position(managerContract.tokenOf(_pair).toString());
  }
  position.owner = _pair.toHexString();
  position.slot = _slot;
  position.pool = pool.id;
  position.liquidity = ZERO_BI;

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

  pool.price = getCurrentPrice(_pair);
  pool.priceAt = event.block.timestamp;
  pool.lastPrice = ZERO_BD;
  pool.lastPriceAt = ZERO_BI;
  pool.lastDayPrice = ZERO_BD;
  pool.lastDayPriceAt = ZERO_BI;
  pool.lastWeekPrice = ZERO_BD;
  pool.lastWeekPriceAt = ZERO_BI;
  pool.createdAt = event.block.timestamp;
  pool.apr = ZERO_BD;

  manager.save();
  pool.save();
  slot.save();
  position.save();
  PoolTemplate.create(_pair);
  token.save();
  collection.save();
  CollectionTemplate.create(_collection);
}
