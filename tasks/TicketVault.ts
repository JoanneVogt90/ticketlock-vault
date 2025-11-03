import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the TicketVault contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the TicketVault contract
 *
 *   npx hardhat --network localhost task:ticket-address
 *   npx hardhat --network localhost task:create-ticket --event "Concert" --venue "Stadium" --date "2025-03-15" --seat 42
 *   npx hardhat --network localhost task:get-tickets
 *   npx hardhat --network localhost task:unlock-ticket --id 0
 *   npx hardhat --network localhost task:lock-ticket --id 0
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the TicketVault contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the TicketVault contract
 *
 *   npx hardhat --network sepolia task:ticket-address
 *   npx hardhat --network sepolia task:create-ticket --event "Concert" --venue "Stadium" --date "2025-03-15" --seat 42
 *   npx hardhat --network sepolia task:get-tickets
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:ticket-address
 *   - npx hardhat --network sepolia task:ticket-address
 */
task("task:ticket-address", "Prints the TicketVault address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const ticketVault = await deployments.get("TicketVault");

  console.log("TicketVault address is " + ticketVault.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:create-ticket --event "Concert" --venue "Stadium" --date "2025-03-15" --seat 42
 *   - npx hardhat --network sepolia task:create-ticket --event "Concert" --venue "Stadium" --date "2025-03-15" --seat 42
 */
task("task:create-ticket", "Creates a new ticket with encrypted seat number")
  .addOptionalParam("address", "Optionally specify the TicketVault contract address")
  .addParam("event", "The event name")
  .addParam("venue", "The venue name")
  .addParam("date", "The event date")
  .addParam("seat", "The seat number (will be encrypted)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const seatNumber = parseInt(taskArguments.seat);
    if (!Number.isInteger(seatNumber)) {
      throw new Error(`Argument --seat is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const TicketVaultDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("TicketVault");
    console.log(`TicketVault: ${TicketVaultDeployment.address}`);

    const signers = await ethers.getSigners();

    const ticketVaultContract = await ethers.getContractAt("TicketVault", TicketVaultDeployment.address);

    // Encrypt the seat number
    const encryptedSeat = await fhevm
      .createEncryptedInput(TicketVaultDeployment.address, signers[0].address)
      .add32(seatNumber)
      .encrypt();

    const tx = await ticketVaultContract
      .connect(signers[0])
      .createTicket(
        taskArguments.event,
        taskArguments.venue,
        taskArguments.date,
        encryptedSeat.handles[0],
        encryptedSeat.inputProof
      );
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const ticketCount = await ticketVaultContract.getTicketCount();
    console.log(`Ticket created! Total tickets: ${ticketCount}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-tickets
 *   - npx hardhat --network sepolia task:get-tickets
 */
task("task:get-tickets", "Gets all tickets owned by the signer")
  .addOptionalParam("address", "Optionally specify the TicketVault contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const TicketVaultDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("TicketVault");
    console.log(`TicketVault: ${TicketVaultDeployment.address}`);

    const signers = await ethers.getSigners();

    const ticketVaultContract = await ethers.getContractAt("TicketVault", TicketVaultDeployment.address);

    const ticketIds = await ticketVaultContract.getOwnerTickets(signers[0].address);
    console.log(`Owner ${signers[0].address} has ${ticketIds.length} tickets`);

    for (const ticketId of ticketIds) {
      const metadata = await ticketVaultContract.getTicketMetadata(ticketId);
      console.log(`\nTicket #${ticketId}:`);
      console.log(`  Event: ${metadata.eventName}`);
      console.log(`  Venue: ${metadata.venue}`);
      console.log(`  Date: ${metadata.date}`);
      console.log(`  Owner: ${metadata.owner}`);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-seat --id 0
 *   - npx hardhat --network sepolia task:decrypt-seat --id 0
 */
task("task:decrypt-seat", "Decrypts the seat number of a ticket")
  .addOptionalParam("address", "Optionally specify the TicketVault contract address")
  .addParam("id", "The ticket ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const ticketId = parseInt(taskArguments.id);
    if (!Number.isInteger(ticketId)) {
      throw new Error(`Argument --id is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const TicketVaultDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("TicketVault");
    console.log(`TicketVault: ${TicketVaultDeployment.address}`);

    const signers = await ethers.getSigners();

    const ticketVaultContract = await ethers.getContractAt("TicketVault", TicketVaultDeployment.address);

    const encryptedSeat = await ticketVaultContract.connect(signers[0]).getEncryptedSeatNumber(ticketId);
    
    if (encryptedSeat === ethers.ZeroHash) {
      console.log(`Encrypted seat: ${encryptedSeat}`);
      console.log("Clear seat: 0");
      return;
    }

    const clearSeat = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSeat,
      TicketVaultDeployment.address,
      signers[0],
    );
    console.log(`Encrypted seat: ${encryptedSeat}`);
    console.log(`Clear seat: ${clearSeat}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-lock --id 0
 *   - npx hardhat --network sepolia task:decrypt-lock --id 0
 */
task("task:decrypt-lock", "Decrypts the lock status of a ticket")
  .addOptionalParam("address", "Optionally specify the TicketVault contract address")
  .addParam("id", "The ticket ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const ticketId = parseInt(taskArguments.id);
    if (!Number.isInteger(ticketId)) {
      throw new Error(`Argument --id is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const TicketVaultDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("TicketVault");
    console.log(`TicketVault: ${TicketVaultDeployment.address}`);

    const signers = await ethers.getSigners();

    const ticketVaultContract = await ethers.getContractAt("TicketVault", TicketVaultDeployment.address);

    const encryptedLock = await ticketVaultContract.connect(signers[0]).getEncryptedLockStatus(ticketId);
    
    if (encryptedLock === ethers.ZeroHash) {
      console.log(`Encrypted lock: ${encryptedLock}`);
      console.log("Lock status: unknown");
      return;
    }

    const clearLock = await fhevm.userDecryptEbool(
      encryptedLock,
      TicketVaultDeployment.address,
      signers[0],
    );
    console.log(`Encrypted lock: ${encryptedLock}`);
    console.log(`Lock status: ${clearLock ? "LOCKED" : "UNLOCKED"}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:unlock-ticket --id 0
 *   - npx hardhat --network sepolia task:unlock-ticket --id 0
 */
task("task:unlock-ticket", "Unlocks a ticket")
  .addOptionalParam("address", "Optionally specify the TicketVault contract address")
  .addParam("id", "The ticket ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const ticketId = parseInt(taskArguments.id);
    if (!Number.isInteger(ticketId)) {
      throw new Error(`Argument --id is not an integer`);
    }

    const TicketVaultDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("TicketVault");
    console.log(`TicketVault: ${TicketVaultDeployment.address}`);

    const signers = await ethers.getSigners();

    const ticketVaultContract = await ethers.getContractAt("TicketVault", TicketVaultDeployment.address);

    const tx = await ticketVaultContract.connect(signers[0]).unlockTicket(ticketId);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
    console.log(`Ticket #${ticketId} unlocked!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:lock-ticket --id 0
 *   - npx hardhat --network sepolia task:lock-ticket --id 0
 */
task("task:lock-ticket", "Locks a ticket")
  .addOptionalParam("address", "Optionally specify the TicketVault contract address")
  .addParam("id", "The ticket ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const ticketId = parseInt(taskArguments.id);
    if (!Number.isInteger(ticketId)) {
      throw new Error(`Argument --id is not an integer`);
    }

    const TicketVaultDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("TicketVault");
    console.log(`TicketVault: ${TicketVaultDeployment.address}`);

    const signers = await ethers.getSigners();

    const ticketVaultContract = await ethers.getContractAt("TicketVault", TicketVaultDeployment.address);

    const tx = await ticketVaultContract.connect(signers[0]).lockTicket(ticketId);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
    console.log(`Ticket #${ticketId} locked!`);
  });
