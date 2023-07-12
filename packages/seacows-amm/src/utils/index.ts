import { BigInt, BigDecimal, ethereum, Address } from "@graphprotocol/graph-ts";
import { Transaction, Pool, PoolDayData, PoolWeekData, PoolYearData, Token } from "../../generated/schema";
import { Pool as PoolContract } from "../../generated/templates/Pool/Pool";
import { ZERO_BI, ONE_BI, ZERO_BD, PERCENTAGE_PRECISION } from "../constants";

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

export function updatePoolYearData(event: ethereum.Event): PoolYearData {
  const timestamp = event.block.timestamp.toI32();
  const yearID = timestamp / (86400 * 7 * 365);
  const yearStartTimestamp = yearID * 86400 * 7 * 365;
  const yearPoolID = event.address
    .toHexString()
    .concat("-")
    .concat(yearID.toString());

  const pool = Pool.load(event.address.toHexString()) as Pool;
  let poolYearData = PoolYearData.load(yearPoolID);
  if (poolYearData === null) {
    poolYearData = new PoolYearData(yearPoolID);
    poolYearData.year = yearStartTimestamp;
    poolYearData.pool = pool.id;
    poolYearData.volume = ZERO_BD;
    poolYearData.price = ZERO_BD;
    poolYearData.priceChange = ZERO_BD;
  }

  // update current price
  poolYearData.price = getCurrentPrice(event.address);

  poolYearData.save();

  return poolYearData as PoolYearData;
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

export function updateAPR(event: ethereum.Event): void {
  const timestamp = event.block.timestamp.toI32();
  const yearId = timestamp / (86400 * 7 * 365);
  const pool = Pool.load(event.address.toHexString()) as Pool;

  const poolContract = PoolContract.bind(event.address);
  const feePercentage = poolContract.feePercent();

  let totalVolume: BigDecimal = ZERO_BD;

  const yearPoolID = event.address
    .toHexString()
    .concat("-")
    .concat(yearId.toString());

  let poolYearData = PoolYearData.load(yearPoolID);
  if (poolYearData) {
    totalVolume = poolYearData.volume;
  }

  let token = Token.load(pool.token) as Token;
  // on smart contract, percentage precision is 10 ** 4
  const totalFee = totalVolume
    .times(BigDecimal.fromString(feePercentage.toString()))
    .div(BigDecimal.fromString("10000"));
  const totalValueLocked = convertTokenToDecimal(pool.liquidity, token.decimals).times(BigDecimal.fromString("2"));

  pool.totalVolume = totalVolume;
  pool.totalFee = totalFee;
  pool.totalValueLocked = totalValueLocked;

  pool.save();
}
