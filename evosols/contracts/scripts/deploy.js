const hre = require("hardhat");

async function main() {
  console.log("Deploying EvoSouls contract...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC");

  // Deploy contract
  const EvoSouls = await hre.ethers.getContractFactory("EvoSouls");
  
  // Constructor parameters
  const contractName = "EvoSouls";
  const contractSymbol = "EVOS";
  const baseURI = "https://api.verbwire.com/v1/nft/data/"; // Update with actual URI
  
  const evoSouls = await EvoSouls.deploy(contractName, contractSymbol, baseURI);
  await evoSouls.waitForDeployment();
  
  const contractAddress = await evoSouls.getAddress();
  console.log("EvoSouls deployed to:", contractAddress);
  
  // Verify contract on Polygonscan (if not localhost)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await evoSouls.deploymentTransaction().wait(6);
    
    console.log("Verifying contract on Polygonscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [contractName, contractSymbol, baseURI],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }
  
  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: evoSouls.deploymentTransaction().hash
  };
  
  fs.writeFileSync(
    `./deployments/${hre.network.name}-deployment.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\nDeployment complete!");
  console.log("Contract Address:", contractAddress);
  console.log("\nUpdate your .env files with:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });