/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const MonPadAddresses = {
  10143: "0xBae9F76833AAAAfb2833AD258b75909601A35C80",
  11155111: "0xBae9F76833AAAAfb2833AD258b75909601A35C80",
} as const;

export function getMonPadAddress(chainId: number): string {
  const address = MonPadAddresses[chainId as keyof typeof MonPadAddresses];
  if (!address) {
    throw new Error(`MonPad not deployed on chain ${chainId}`);
  }
  return address;
}
