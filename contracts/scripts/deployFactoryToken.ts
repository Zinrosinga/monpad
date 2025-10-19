import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying FactoryToken contract...");

  // Get the contract factory
  const FactoryToken = await ethers.getContractFactory("FactoryToken");

  // Deploy the contract
  const factoryToken = await FactoryToken.deploy();

  // Wait for deployment to be mined
  await factoryToken.waitForDeployment();

  const factoryAddress = await factoryToken.getAddress();
  console.log("✅ FactoryToken deployed to:", factoryAddress);

  // Get network info
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${chainId})`);

  // Save to deployments directory
  const outDir = path.join(__dirname, "../deployments");
  fs.mkdirSync(outDir, { recursive: true });
  
  // Read existing deployments
  const factoryPath = path.join(outDir, "factory.json");
  let existingData: any = {};
  
  if (fs.existsSync(factoryPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(factoryPath, "utf-8"));
    } catch (err) {
      console.log("⚠️ Could not read existing factory.json, creating new file");
    }
  }
  
  // Update with new deployment for this chain
  existingData[chainId.toString()] = {
    chainId: chainId,
    chainName: network.name,
    address: factoryAddress,
    deployedAt: new Date().toISOString(),
    contractName: "FactoryToken"
  };
  
  // Save ABI separately (shared across all networks)
  existingData.abi = (await hre.artifacts.readArtifact("FactoryToken")).abi;
  
  fs.writeFileSync(
    factoryPath,
    JSON.stringify(existingData, null, 2)
  );

  console.log(`📝 Deployment info saved to deployments/factory.json (Chain ID: ${chainId})`);
  console.log("🔗 Copy this address to your frontend config:", factoryAddress);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
