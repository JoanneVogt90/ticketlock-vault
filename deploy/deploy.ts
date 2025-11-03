import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedTicketVault = await deploy("TicketVault", {
    from: deployer,
    log: true,
  });

  console.log(`TicketVault contract: `, deployedTicketVault.address);
};
export default func;
func.id = "deploy_ticketVault"; // id required to prevent reexecution
func.tags = ["TicketVault"];
