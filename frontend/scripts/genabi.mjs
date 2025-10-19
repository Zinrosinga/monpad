import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Danh sách contracts cần generate
const CONTRACTS = ["FactoryToken", "MyToken", "MonPad"];

// Path: từ frontend/scripts lên monad-m8, vào contracts
const contractsDir = path.resolve(__dirname, "../../contracts");
const deploymentsDir = path.join(contractsDir, "deployments");

// Output: frontend/src/abi
const outdir = path.resolve(__dirname, "../src/abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

const line = "\n===================================================================\n";

if (!fs.existsSync(contractsDir)) {
  console.error(`${line}Unable to locate contracts directory at ${contractsDir}${line}`);
  process.exit(1);
}


// ===================== Tokens =====================
console.log("\n🔄 Generating Tokens...");

const tokensFile = path.join(deploymentsDir, "tokens.json");
if (!fs.existsSync(tokensFile)) {
  console.error(`${line}Tokens deployment not found at ${tokensFile}${line}`);
  process.exit(1);
}

const tokensDeployment = JSON.parse(fs.readFileSync(tokensFile, "utf-8"));

// Generate MyTokenABI (chung cho tất cả tokens)
const myTokenABI = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const MyTokenABI = ${JSON.stringify({ abi: tokensDeployment.abi }, null, 2)} as const;
`;

fs.writeFileSync(path.join(outdir, "MyTokenABI.ts"), myTokenABI, "utf-8");
console.log(`✅ Generated MyTokenABI.ts`);

// Generate TokenAddresses for all chains
// Expected format: { "10143": { chainId, chainName, tokens: [...] }, "11155111": {...}, abi: [...] }
const chains = Object.keys(tokensDeployment).filter(key => key !== 'abi');
console.log(`📦 Found ${chains.length} chain(s): ${chains.join(', ')}`);

const chainEntries = chains.map(chainId => {
  const chainData = tokensDeployment[chainId];
  const tokensMap = chainData.tokens.map(t => 
    `      ${t.symbol}: { name: "${t.name}", symbol: "${t.symbol}", address: "${t.address}" as const }`
  ).join(',\n');
  
  return `  "${chainId}": {
    chainId: ${chainData.chainId},
    chainName: "${chainData.chainName}",
    tokens: {
${tokensMap}
    }
  }`;
}).join(',\n');

const tokenAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const TokenAddresses = {
${chainEntries}
};

// Helper to get token by symbol
export function getTokenAddress(chainId: number, symbol: string): string | undefined {
  const chain = TokenAddresses[chainId.toString() as keyof typeof TokenAddresses];
  if (!chain) return undefined;
  return chain.tokens[symbol as keyof typeof chain.tokens]?.address;
}

// Export list of all tokens on chain
export function getTokens(chainId: number) {
  const chain = TokenAddresses[chainId.toString() as keyof typeof TokenAddresses];
  if (!chain) return [];
  return Object.values(chain.tokens);
}
`;

fs.writeFileSync(path.join(outdir, "TokenAddresses.ts"), tokenAddresses, "utf-8");
console.log(`✅ Generated TokenAddresses.ts`);

// ===================== FactoryToken =====================
if (CONTRACTS.includes("FactoryToken")) {
  console.log(`\n${line}Processing FactoryToken${line}`);
  
  // Read factory.json
  const factoryPath = path.join(deploymentsDir, "factory.json");
  if (!fs.existsSync(factoryPath)) {
    console.log(`⚠️ factory.json not found at ${factoryPath}`);
  } else {
    const factoryData = JSON.parse(fs.readFileSync(factoryPath, "utf-8"));
    
    // Generate FactoryTokenABI.ts
    const factoryABI = factoryData.abi;
    const factoryABITs = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const FactoryTokenABI = {
  "abi": ${JSON.stringify(factoryABI, null, 2)}
} as const;
`;
    
    fs.writeFileSync(path.join(outdir, "FactoryTokenABI.ts"), factoryABITs, "utf-8");
    console.log(`✅ Generated FactoryTokenABI.ts`);
    
    // Generate FactoryTokenAddresses.ts
    const factoryAddresses = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const FactoryTokenAddresses = {
${Object.entries(factoryData)
  .filter(([key]) => key !== "abi")
  .map(([chainId, data]) => `  ${chainId}: "${data.address}",`)
  .join("\n")}
} as const;

export function getFactoryTokenAddress(chainId: number): string {
  const address = FactoryTokenAddresses[chainId as keyof typeof FactoryTokenAddresses];
  if (!address) {
    throw new Error(\`FactoryToken not deployed on chain \${chainId}\`);
  }
  return address;
}
`;
    
    fs.writeFileSync(path.join(outdir, "FactoryTokenAddresses.ts"), factoryAddresses, "utf-8");
    console.log(`✅ Generated FactoryTokenAddresses.ts`);
  }
}

// ===================== MonPad =====================
if (CONTRACTS.includes("MonPad")) {
  console.log(`\n${line}Processing MonPad${line}`);
  
  // Read monpad.json
  const monPadPath = path.join(deploymentsDir, "monpad.json");
  if (!fs.existsSync(monPadPath)) {
    console.log(`⚠️ monpad.json not found at ${monPadPath}`);
  } else {
    const monPadData = JSON.parse(fs.readFileSync(monPadPath, "utf-8"));
    
    // Generate MonPadABI.ts
    const monPadABI = monPadData.abi;
    const monPadABITs = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const MonPadABI = {
  "abi": ${JSON.stringify(monPadABI, null, 2)}
} as const;
`;
    
    fs.writeFileSync(path.join(outdir, "MonPadABI.ts"), monPadABITs, "utf-8");
    console.log(`✅ Generated MonPadABI.ts`);
    
    // Generate MonPadAddresses.ts
    const monPadAddresses = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const MonPadAddresses = {
${Object.entries(monPadData)
  .filter(([key]) => key !== "abi")
  .map(([chainId, data]) => `  ${chainId}: "${data.address}",`)
  .join("\n")}
} as const;

export function getMonPadAddress(chainId: number): string {
  const address = MonPadAddresses[chainId as keyof typeof MonPadAddresses];
  if (!address) {
    throw new Error(\`MonPad not deployed on chain \${chainId}\`);
  }
  return address;
}
`;
    
    fs.writeFileSync(path.join(outdir, "MonPadAddresses.ts"), monPadAddresses, "utf-8");
    console.log(`✅ Generated MonPadAddresses.ts`);
  }
}

// ===================== contracts.ts (tổng hợp) =====================
const contractsTs = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
import { MyTokenABI } from './MyTokenABI';
import { TokenAddresses, getTokenAddress, getTokens } from './TokenAddresses';
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
  Tokens: TokenAddresses,
  FactoryToken: FactoryTokenAddresses,
  MonPad: MonPadAddresses,
};

// Export individual contracts
export { MyTokenABI, TokenAddresses, getTokenAddress, getTokens };
export { FactoryTokenABI, FactoryTokenAddresses, getFactoryTokenAddress };
export { MonPadABI, MonPadAddresses, getMonPadAddress };
`;

fs.writeFileSync(path.join(outdir, "contracts.ts"), contractsTs, "utf-8");

console.log(`\n🎉 All done! Generated files:`);
console.log(`   - MyTokenABI.ts`);
console.log(`   - TokenAddresses.ts`);
console.log(`   - FactoryTokenABI.ts`);
console.log(`   - FactoryTokenAddresses.ts`);
console.log(`   - MonPadABI.ts`);
console.log(`   - MonPadAddresses.ts`);
console.log(`   - contracts.ts (tổng hợp)`);

console.log(`\n📝 Usage example:`);
console.log(`   import { ABIs, Addresses, getTokens } from '@/abi/contracts';`);
console.log(`   const factoryTokenABI = ABIs.FactoryToken;`);
console.log(`   const factoryAddress = Addresses.FactoryToken["10143"].address;`);
console.log(`   const tokens = getTokens(10143); // [{ name, symbol, address }, ...]`);

