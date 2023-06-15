import { BigInt, BigDecimal, ethereum, Address } from "@graphprotocol/graph-ts";
import { Transaction, Pool, PoolDayData, PoolWeekData } from "../../generated/schema";
import { Pool as PoolContract } from "../../generated/templates/Pool/Pool";
import { ZERO_BI, ONE_BI, ZERO_BD } from "../constants";

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function exponentToBigInt(decimals: BigInt): BigInt {
  let bd = BigInt.fromString("1");
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigInt.fromString("10"));
  }
  return bd;
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

export function convertTokenToInt(tokenAmount: BigInt, exchangeDecimals: BigInt): BigInt {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount;
  }
  return tokenAmount.div(exponentToBigInt(exchangeDecimals));
}

export function loadTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString());
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString());
  }
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  // transaction.gasUsed = event.transaction.gasUsed;
  // transaction.gasPrice = event.transaction.gasPrice;
  transaction.save();
  return transaction as Transaction;
}

export function updatePoolDayData(event: ethereum.Event): PoolDayData {
  const timestamp = event.block.timestamp.toI32();
  const dayID = timestamp / 86400;
  const dayStartTimestamp = dayID * 86400;
  const dayPoolID = event.address
    .toHexString()
    .concat("-")
    .concat(dayID.toString());

  const pool = Pool.load(event.address.toHexString()) as Pool;
  let poolDayData = PoolDayData.load(dayPoolID);
  if (poolDayData === null) {
    poolDayData = new PoolDayData(dayPoolID);
    poolDayData.date = dayStartTimestamp;
    poolDayData.pool = pool.id;
    poolDayData.volume = ZERO_BD;
    poolDayData.priceChange = ZERO_BD;
    poolDayData.price = ZERO_BD;
    poolDayData.priceChange = ZERO_BD;
  }

  // update current price
  poolDayData.price = getCurrentPrice(event.address);

  poolDayData.save();

  return poolDayData as PoolDayData;
}

export function updatePoolWeekData(event: ethereum.Event): PoolWeekData {
  const timestamp = event.block.timestamp.toI32();
  const weekID = timestamp / (86400 * 7);
  const weekStartTimestamp = weekID * 86400 * 7;
  const weekPoolID = event.address
    .toHexString()
    .concat("-")
    .concat(weekID.toString());

  const pool = Pool.load(event.address.toHexString()) as Pool;
  let poolWeekData = PoolWeekData.load(weekPoolID);
  if (poolWeekData === null) {
    poolWeekData = new PoolWeekData(weekPoolID);
    poolWeekData.week = weekStartTimestamp;
    poolWeekData.pool = pool.id;
    poolWeekData.volume = ZERO_BD;
    poolWeekData.price = ZERO_BD;
    poolWeekData.priceChange = ZERO_BD;
  }

  // update current price
  poolWeekData.price = getCurrentPrice(event.address);

  poolWeekData.save();

  return poolWeekData as PoolWeekData;
}

export function getCurrentPrice(poolAddress: Address): BigDecimal {
  const poolContract = PoolContract.bind(poolAddress);
  const reserve = poolContract.getReserves();

  if (!reserve.value0.equals(ZERO_BI) && !reserve.value1.equals(ZERO_BI)) {
    return new BigDecimal(reserve.value0).div(new BigDecimal(reserve.value1));
  } else {
    return ZERO_BD;
  }
}
