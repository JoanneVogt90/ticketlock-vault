import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { TicketVault } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("TicketVaultSepolia", function () {
  let signers: Signers;
  let ticketVaultContract: TicketVault;
  let ticketVaultContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const TicketVaultDeployment = await deployments.get("TicketVault");
      ticketVaultContractAddress = TicketVaultDeployment.address;
      ticketVaultContract = await ethers.getContractAt("TicketVault", TicketVaultDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("create ticket and decrypt seat number", async function () {
    steps = 8;

    this.timeout(4 * 40000);

    const eventName = "Sepolia Test Event";
    const venue = "Test Venue";
    const date = "2025-03-15";
    const seatNumber = 42;

    progress("Encrypting seat number...");
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(seatNumber)
      .encrypt();

    progress(
      `Call createTicket() TicketVault=${ticketVaultContractAddress} signer=${signers.alice.address}...`,
    );
    const tx = await ticketVaultContract
      .connect(signers.alice)
      .createTicket(eventName, venue, date, encryptedSeat.handles[0], encryptedSeat.inputProof);
    await tx.wait();

    progress(`Call TicketVault.getTicketCount()...`);
    const ticketCount = await ticketVaultContract.getTicketCount();
    expect(ticketCount).to.be.gt(0);
    progress(`Ticket count: ${ticketCount}`);

    // Get the latest ticket ID (ticketCount - 1)
    const ticketId = ticketCount - BigInt(1);

    progress(`Call TicketVault.getTicketMetadata(${ticketId})...`);
    const metadata = await ticketVaultContract.getTicketMetadata(ticketId);
    expect(metadata[0]).to.eq(eventName); // eventName
    expect(metadata[3]).to.eq(signers.alice.address); // owner
    expect(metadata[5]).to.be.gt(0); // createdAt
    progress(`Ticket metadata: ${metadata[0]} at ${metadata[1]}`);

    progress(`Call TicketVault.getEncryptedSeatNumber(${ticketId})...`);
    const encryptedSeatHandle = await ticketVaultContract.connect(signers.alice).getEncryptedSeatNumber(ticketId);
    expect(encryptedSeatHandle).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting seat number...`);
    const clearSeat = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSeatHandle,
      ticketVaultContractAddress,
      signers.alice,
    );
    progress(`Clear seat number: ${clearSeat}`);

    expect(clearSeat).to.eq(seatNumber);
  });

  it("lock and unlock ticket", async function () {
    steps = 6;

    this.timeout(4 * 40000);

    // Get owner's tickets
    progress(`Getting owner tickets...`);
    const ownerTickets = await ticketVaultContract.getOwnerTickets(signers.alice.address);
    expect(ownerTickets.length).to.be.gt(0);
    const ticketId = ownerTickets[ownerTickets.length - 1];
    progress(`Using ticket ID: ${ticketId}`);

    // Unlock the ticket
    progress(`Unlocking ticket ${ticketId}...`);
    let tx = await ticketVaultContract.connect(signers.alice).unlockTicket(ticketId);
    await tx.wait();

    // Verify unlocked
    progress(`Verifying unlock status...`);
    let encryptedLock = await ticketVaultContract.connect(signers.alice).getEncryptedLockStatus(ticketId);
    let clearLock = await fhevm.userDecryptEbool(encryptedLock, ticketVaultContractAddress, signers.alice);
    expect(clearLock).to.eq(false);
    progress(`Ticket is unlocked: ${!clearLock}`);

    // Lock the ticket again
    progress(`Locking ticket ${ticketId}...`);
    tx = await ticketVaultContract.connect(signers.alice).lockTicket(ticketId);
    await tx.wait();

    // Verify locked
    encryptedLock = await ticketVaultContract.connect(signers.alice).getEncryptedLockStatus(ticketId);
    clearLock = await fhevm.userDecryptEbool(encryptedLock, ticketVaultContractAddress, signers.alice);
    expect(clearLock).to.eq(true);
    progress(`Ticket is locked: ${clearLock}`);
  });
});
