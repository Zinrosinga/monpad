import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying MonPad contract...");

  // Get the contract factory
  const MonPad = await ethers.getContractFactory("MonPad");

  // Deploy the contract
  const monPad = await MonPad.deploy();

  // Wait for deployment to be mined
  await monPad.waitForDeployment();

  const monPadAddress = await monPad.getAddress();
  console.log("✅ MonPad deployed to:", monPadAddress);

  // Get network info
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${chainId})`);

  // Save to deployments directory
  const outDir = path.join(__dirname, "../deployments");
  fs.mkdirSync(outDir, { recursive: true });
  
  // Read existing deployments
  const monPadPath = path.join(outDir, "monpad.json");
  let existingData: any = {};
  
  if (fs.existsSync(monPadPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(monPadPath, "utf-8"));
    } catch (err) {
      console.log("⚠️ Could not read existing monpad.json, creating new file");
    }
  }
  
  // Update with new deployment for this chain
  existingData[chainId.toString()] = {
    chainId: chainId,
    chainName: network.name,
    address: monPadAddress,
    deployedAt: new Date().toISOString(),
    contractName: "MonPad"
  };
  
  // Save ABI separately (shared across all networks)
  existingData.abi = (await hre.artifacts.readArtifact("MonPad")).abi;
  
  fs.writeFileSync(
    monPadPath,
    JSON.stringify(existingData, null, 2)
  );

  console.log(`📝 Deployment info saved to deployments/monpad.json (Chain ID: ${chainId})`);
  console.log("🔗 Copy this address to your frontend config:", monPadAddress);
  console.log("🎉 MonPad deployment complete!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
