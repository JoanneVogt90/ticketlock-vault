import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { TicketVault, TicketVault__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("TicketVault")) as TicketVault__factory;
  const ticketVaultContract = (await factory.deploy()) as TicketVault;
  const ticketVaultContractAddress = await ticketVaultContract.getAddress();

  return { ticketVaultContract, ticketVaultContractAddress };
}

describe("TicketVault", function () {
  let signers: Signers;
  let ticketVaultContract: TicketVault;
  let ticketVaultContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ ticketVaultContract, ticketVaultContractAddress } = await deployFixture());
  });

  it("ticket count should be 0 after deployment", async function () {
    const ticketCount = await ticketVaultContract.getTicketCount();
    expect(ticketCount).to.eq(0);
  });

  it("should create a ticket with encrypted seat number", async function () {
    const eventName = "Championship Finals 2025";
    const venue = "National Stadium";
    const date = "March 15, 2025";
    const seatNumber = 42;

    // Encrypt the seat number
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(seatNumber)
      .encrypt();

    const tx = await ticketVaultContract
      .connect(signers.alice)
      .createTicket(eventName, venue, date, encryptedSeat.handles[0], encryptedSeat.inputProof);
    await tx.wait();

    // Verify ticket count increased
    const ticketCount = await ticketVaultContract.getTicketCount();
    expect(ticketCount).to.eq(1);

    // Verify ticket metadata
    const metadata = await ticketVaultContract.getTicketMetadata(0);
    expect(metadata.eventName).to.eq(eventName);
    expect(metadata.venue).to.eq(venue);
    expect(metadata.date).to.eq(date);
    expect(metadata.owner).to.eq(signers.alice.address);
    expect(metadata.exists).to.eq(true);

    // Verify owner tickets
    const ownerTickets = await ticketVaultContract.getOwnerTickets(signers.alice.address);
    expect(ownerTickets.length).to.eq(1);
    expect(ownerTickets[0]).to.eq(0);
  });

  it("should decrypt seat number for ticket owner", async function () {
    const seatNumber = 123;

    // Create ticket
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(seatNumber)
      .encrypt();

    await ticketVaultContract
      .connect(signers.alice)
      .createTicket("Test Event", "Test Venue", "2025-01-01", encryptedSeat.handles[0], encryptedSeat.inputProof);

    // Get encrypted seat handle
    const encryptedSeatHandle = await ticketVaultContract.connect(signers.alice).getEncryptedSeatNumber(0);

    // Decrypt the seat number
    const clearSeat = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSeatHandle,
      ticketVaultContractAddress,
      signers.alice,
    );

    expect(clearSeat).to.eq(seatNumber);
  });

  it("should unlock and lock a ticket", async function () {
    // Create ticket
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await ticketVaultContract
      .connect(signers.alice)
      .createTicket("Test Event", "Test Venue", "2025-01-01", encryptedSeat.handles[0], encryptedSeat.inputProof);

    // Initially locked (true)
    let encryptedLock = await ticketVaultContract.connect(signers.alice).getEncryptedLockStatus(0);
    let clearLock = await fhevm.userDecryptEbool(encryptedLock, ticketVaultContractAddress, signers.alice);
    expect(clearLock).to.eq(true);

    // Unlock the ticket
    await ticketVaultContract.connect(signers.alice).unlockTicket(0);

    // Should be unlocked (false)
    encryptedLock = await ticketVaultContract.connect(signers.alice).getEncryptedLockStatus(0);
    clearLock = await fhevm.userDecryptEbool(encryptedLock, ticketVaultContractAddress, signers.alice);
    expect(clearLock).to.eq(false);

    // Lock the ticket again
    await ticketVaultContract.connect(signers.alice).lockTicket(0);

    // Should be locked (true)
    encryptedLock = await ticketVaultContract.connect(signers.alice).getEncryptedLockStatus(0);
    clearLock = await fhevm.userDecryptEbool(encryptedLock, ticketVaultContractAddress, signers.alice);
    expect(clearLock).to.eq(true);
  });

  it("should not allow non-owner to access encrypted data", async function () {
    // Create ticket as alice
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await ticketVaultContract
      .connect(signers.alice)
      .createTicket("Test Event", "Test Venue", "2025-01-01", encryptedSeat.handles[0], encryptedSeat.inputProof);

    // Bob should not be able to get encrypted seat
    await expect(ticketVaultContract.connect(signers.bob).getEncryptedSeatNumber(0)).to.be.revertedWith(
      "Not ticket owner",
    );

    // Bob should not be able to get encrypted lock status
    await expect(ticketVaultContract.connect(signers.bob).getEncryptedLockStatus(0)).to.be.revertedWith(
      "Not ticket owner",
    );
  });

  it("should transfer ticket to new owner", async function () {
    // Create ticket as alice
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await ticketVaultContract
      .connect(signers.alice)
      .createTicket("Test Event", "Test Venue", "2025-01-01", encryptedSeat.handles[0], encryptedSeat.inputProof);

    // Transfer to bob
    await ticketVaultContract.connect(signers.alice).transferTicket(0, signers.bob.address);

    // Verify ownership changed
    const metadata = await ticketVaultContract.getTicketMetadata(0);
    expect(metadata.owner).to.eq(signers.bob.address);

    // Alice should no longer have the ticket
    const aliceTickets = await ticketVaultContract.getOwnerTickets(signers.alice.address);
    expect(aliceTickets.length).to.eq(0);

    // Bob should have the ticket
    const bobTickets = await ticketVaultContract.getOwnerTickets(signers.bob.address);
    expect(bobTickets.length).to.eq(1);
    expect(bobTickets[0]).to.eq(0);
  });

  it("should reject ticket creation with empty event name", async function () {
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await expect(
      ticketVaultContract
        .connect(signers.alice)
        .createTicket("", "Test Venue", "2025-01-01", encryptedSeat.handles[0], encryptedSeat.inputProof),
    ).to.be.revertedWith("Event name cannot be empty");
  });

  it("should reject ticket creation with empty venue", async function () {
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await expect(
      ticketVaultContract
        .connect(signers.alice)
        .createTicket("Test Event", "", "2025-01-01", encryptedSeat.handles[0], encryptedSeat.inputProof),
    ).to.be.revertedWith("Venue cannot be empty");
  });

  it("should reject ticket creation with empty date", async function () {
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await expect(
      ticketVaultContract
        .connect(signers.alice)
        .createTicket("Test Event", "Test Venue", "", encryptedSeat.handles[0], encryptedSeat.inputProof),
    ).to.be.revertedWith("Date cannot be empty");
  });

  it("should reject transfer to zero address", async function () {
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await ticketVaultContract
      .connect(signers.alice)
      .createTicket("Test Event", "Test Venue", "2025-01-01", encryptedSeat.handles[0], encryptedSeat.inputProof);

    await expect(
      ticketVaultContract.connect(signers.alice).transferTicket(0, "0x0000000000000000000000000000000000000000"),
    ).to.be.revertedWith("Invalid new owner");
  });

  it("should reject transfer to self", async function () {
    const encryptedSeat = await fhevm
      .createEncryptedInput(ticketVaultContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await ticketVaultContract
      .connect(signers.alice)
      .createTicket("Test Event", "Test Venue", "2025-01-01", encryptedSeat.handles[0], encryptedSeat.inputProof);

    await expect(
      ticketVaultContract.connect(signers.alice).transferTicket(0, signers.alice.address),
    ).to.be.revertedWith("Cannot transfer to self");
  });

  it("should reject operations on non-existent ticket", async function () {
    await expect(ticketVaultContract.connect(signers.alice).unlockTicket(999)).to.be.revertedWith(
      "Ticket does not exist",
    );

    await expect(ticketVaultContract.connect(signers.alice).lockTicket(999)).to.be.revertedWith(
      "Ticket does not exist",
    );

    await expect(
      ticketVaultContract.connect(signers.alice).transferTicket(999, signers.bob.address),
    ).to.be.revertedWith("Ticket does not exist");
  });
});
