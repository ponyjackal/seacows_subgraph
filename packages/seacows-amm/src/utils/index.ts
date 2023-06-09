import { BigInt, BigDecimal, ethereum, Address } from "@graphprotocol/graph-ts";
import { Transaction } from "../../generated/schema";
import { ZERO_BI, ONE_BI } from "../constants";

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
