import { NFT, Collection, User, Pool } from "../../generated/schema";
import {
  Transfer as TransferEvent,
  Collection as CollectionContract
} from "../../generated/templates/Collection/Collection";
import { ONE_BI, BI_18, ZERO_BI } from "../constants";
import { convertTokenToDecimal, loadTransaction } from "../utils";

export function handleTransfer(event: TransferEvent): void {
  const _collectionAddress = event.address;
  const _from = event.params.from;
  const _to = event.params.to;
  const _tokenId = event.params.tokenId;

  let fromPool = Pool.load(_from.toHexString());
  let toPool = Pool.load(_to.toHexString());
  if (fromPool == null && toPool == null) {
    return;
  }

  let collection = Collection.load(_collectionAddress.toHexString());
  const collectionContract = CollectionContract.bind(_collectionAddress);
  if (collection == null) {
    return;
  }

  const nftId = `${_collectionAddress.toHexString()}-${_tokenId}`;
  let nft = NFT.load(nftId);
  if (nft == null) {
    nft = new NFT(nftId);
    nft.collection = collection.id;
    nft.tokenId = _tokenId;
    nft.tokenURI = collectionContract.tokenURI(_tokenId);
  }

  if (fromPool != null) {
    nft.pool = null;
  }

  if (toPool != null) {
    nft.pool = toPool.id;
  }

  collection.save();
  nft.save();
}
