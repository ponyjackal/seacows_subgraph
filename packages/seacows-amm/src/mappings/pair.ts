import { User } from "../generated/schema";
import { Transfer } from "../generated/USDC/ERC20";

export function handleTransfer(event: Transfer): void {
  const address = event.address;
  const from = event.params.from;
  const to = event.params.to;
  const amount = event.params.value;

  let user1 = User.load(from.toHexString());

  if (user1 === null) {
    user1 = new User(from.toHexString());
    user1.save();
  }

  let user2 = User.load(to.toHexString());

  if (user2 === null) {
    user2 = new User(to.toHexString());
    user2.save();
  }
}
