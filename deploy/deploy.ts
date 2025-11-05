import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const { ethers } = hre;

  console.log(`Deploying TicketVault with account: ${deployer}`);

  const deployedTicketVault = await deploy("TicketVault", {
    from: deployer,
    log: true,
    waitConfirmations: hre.network.name === "sepolia" ? 6 : 1,
  });

  console.log(`TicketVault deployed to: ${deployedTicketVault.address}`);

  // Verify deployment
  const ticketVault = await ethers.getContractAt("TicketVault", deployedTicketVault.address);
  const ticketCount = await ticketVault.getTicketCount();
  console.log(`Initial ticket count: ${ticketCount}`);

  if (deployedTicketVault.newlyDeployed) {
    console.log(`TicketVault newly deployed at ${deployedTicketVault.address}`);
  } else {
    console.log(`TicketVault reused at ${deployedTicketVault.address}`);
  }
};
export default func;
func.id = "deploy_ticketVault"; // id required to prevent reexecution
func.tags = ["TicketVault"];
