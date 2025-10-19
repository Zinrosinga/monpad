
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
import { MyTokenABI } from './MyTokenABI';
import { FactoryTokenABI } from './FactoryTokenABI';
import { FactoryTokenAddresses, getFactoryTokenAddress } from './FactoryTokenAddresses';
import { MonPadABI } from './MonPadABI';
import { MonPadAddresses, getMonPadAddress } from './MonPadAddresses';

// Export tất cả ABIs
export const ABIs = {
  MyToken: MyTokenABI.abi,
  FactoryToken: FactoryTokenABI.abi,
  MonPad: MonPadABI.abi,
};

// Export tất cả Addresses
export const Addresses = {
  FactoryToken: FactoryTokenAddresses,
  MonPad: MonPadAddresses,
};

// Export individual contracts
export { MyTokenABI };
export { FactoryTokenABI, FactoryTokenAddresses, getFactoryTokenAddress };
export { MonPadABI, MonPadAddresses, getMonPadAddress };
