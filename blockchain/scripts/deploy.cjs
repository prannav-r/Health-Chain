const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`Starting HealthChain deployment on network: ${hre.network.name}...`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const HealthChain = await hre.ethers.getContractFactory("HealthChain");
  const healthChain = await HealthChain.deploy();
  await healthChain.waitForDeployment();

  const contractAddress = await healthChain.getAddress();
  console.log(`HealthChain deployed successfully to: ${contractAddress}`);

  // Read ABI from Hardhat artifact
  const artifactPath = path.resolve(
    __dirname,
    "../artifacts/contracts/HealthChain.sol/HealthChain.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const configData = {
    address: contractAddress,
    network: hre.network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi
  };

  // Write to backend config
  const backendConfigDir = path.resolve(__dirname, "../../backend/src/config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }
  const backendConfigFile = path.join(backendConfigDir, "contractConfig.json");
  fs.writeFileSync(backendConfigFile, JSON.stringify(configData, null, 2));
  console.log(`Saved contract configuration to: ${backendConfigFile}`);

  // Write to blockchain directory for reference
  const blockchainConfigFile = path.resolve(__dirname, "../deployed-contract.json");
  fs.writeFileSync(blockchainConfigFile, JSON.stringify(configData, null, 2));
  console.log(`Saved deployment reference to: ${blockchainConfigFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
