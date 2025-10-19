/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const FactoryTokenAddresses = {
  10143: "0x71fCa30B945DD1bC30FE7a8bEC63656213bC8a74",
  11155111: "0x71fCa30B945DD1bC30FE7a8bEC63656213bC8a74",
} as const;

export function getFactoryTokenAddress(chainId: number): string {
  const address = FactoryTokenAddresses[chainId as keyof typeof FactoryTokenAddresses];
  if (!address) {
    throw new Error(`FactoryToken not deployed on chain ${chainId}`);
  }
  return address;
}
