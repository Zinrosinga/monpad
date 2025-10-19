import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path: từ frontend/scripts lên metamask, vào contracts
const contractsDir = path.resolve(__dirname, "../../contracts");
const artifactsDir = path.join(contractsDir, "artifacts", "contracts");

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

// ===================== MyToken Bytecode =====================
console.log("\n🔄 Generating MyToken Bytecode...");

const myTokenArtifactPath = path.join(artifactsDir, "MyToken.sol", "MyToken.json");

if (!fs.existsSync(myTokenArtifactPath)) {
  console.error(`${line}MyToken artifact not found at ${myTokenArtifactPath}${line}`);
  console.log("Please run 'npx hardhat compile' first to generate artifacts");
  process.exit(1);
}

const myTokenArtifact = JSON.parse(fs.readFileSync(myTokenArtifactPath, "utf-8"));

// Extract bytecode
const bytecode = myTokenArtifact.bytecode;
const abi = myTokenArtifact.abi;

if (!bytecode) {
  console.error(`${line}Bytecode not found in MyToken artifact${line}`);
  process.exit(1);
}

// Generate MyTokenBytecode.ts
const myTokenBytecode = `
/*
  This file is auto-generated.
  Command: 'npm run genbytecode'
*/
export const MyTokenBytecode = "${bytecode}" as const;

export const MyTokenABI = ${JSON.stringify({ abi }, null, 2)} as const;

// Constructor parameters for MyToken
export interface MyTokenConstructorParams {
  name: string;
  symbol: string;
  initialSupply: string; // in wei (use parseEther for conversion)
}

// Helper function to encode constructor parameters
export function encodeMyTokenConstructor(params: MyTokenConstructorParams) {
  // This will be used with viem's encodeFunctionData
  return {
    name: params.name,
    symbol: params.symbol,
    initialSupply: BigInt(params.initialSupply)
  };
}
`;

fs.writeFileSync(path.join(outdir, "MyTokenBytecode.ts"), myTokenBytecode, "utf-8");
console.log(`✅ Generated MyTokenBytecode.ts`);

// Update contracts.ts to include bytecode
const contractsTsPath = path.join(outdir, "contracts.ts");
let contractsTs = "";

if (fs.existsSync(contractsTsPath)) {
  contractsTs = fs.readFileSync(contractsTsPath, "utf-8");
  
  // Add bytecode import if not exists
  if (!contractsTs.includes("MyTokenBytecode")) {
    const importLine = "import { MyTokenABI } from './MyTokenABI';";
    const newImportLine = "import { MyTokenABI } from './MyTokenABI';\nimport { MyTokenBytecode } from './MyTokenBytecode';";
    contractsTs = contractsTs.replace(importLine, newImportLine);
    
    // Add bytecode to exports
    const exportLine = "export { MyTokenABI, TokenAddresses, getTokenAddress, getTokens };";
    const newExportLine = "export { MyTokenABI, MyTokenBytecode, TokenAddresses, getTokenAddress, getTokens };";
    contractsTs = contractsTs.replace(exportLine, newExportLine);
    
    fs.writeFileSync(contractsTsPath, contractsTs, "utf-8");
    console.log(`✅ Updated contracts.ts with bytecode`);
  }
} else {
  // Create contracts.ts if it doesn't exist
  const contractsTs = `
/*
  This file is auto-generated.
  Command: 'npm run genbytecode'
*/
import { MyTokenABI } from './MyTokenABI';
import { MyTokenBytecode } from './MyTokenBytecode';

// Export tất cả ABIs và Bytecodes
export const ABIs = {
  MyToken: MyTokenABI.abi,
};

export const Bytecodes = {
  MyToken: MyTokenBytecode,
};

// Export individual contracts
export { MyTokenABI, MyTokenBytecode };
`;

  fs.writeFileSync(contractsTsPath, contractsTs, "utf-8");
  console.log(`✅ Generated contracts.ts`);
}

console.log(`\n🎉 All done! Generated files:`);
console.log(`   - MyTokenBytecode.ts`);
console.log(`   - Updated contracts.ts`);

console.log(`\n📝 Usage example:`);
console.log(`   import { MyTokenBytecode, MyTokenABI } from '@/abi/contracts';`);
console.log(`   const bytecode = MyTokenBytecode;`);
console.log(`   const abi = MyTokenABI.abi;`);
console.log(`   // Use with viem's deployContract or similar`);
