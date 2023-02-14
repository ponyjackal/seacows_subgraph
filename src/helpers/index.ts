const toPocketHolderId = (pocket: string, holder: string): string => {
  return `${pocket}-${holder}`;
};

const toERC20HoldingId = (pocket: string, holder: string, token: string): string => {
  return `${pocket}-${holder}-${token}`;
};

const toERC721HoldingId = (pocket: string, holder: string, collection: string, tokenId: string): string => {
  return `${pocket}-${holder}-${collection}-${tokenId}`;
};

const toERC1155HoldingId = (pocket: string, holder: string, collection: string, tokenId: string): string => {
  return `${pocket}-${holder}-${collection}-${tokenId}`;
};

export { toPocketHolderId, toERC20HoldingId, toERC721HoldingId, toERC1155HoldingId };
