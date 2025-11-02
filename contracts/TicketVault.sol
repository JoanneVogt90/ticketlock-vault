// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title TicketVault - FHE-encrypted ticket management system
/// @author ticketlock-vault
/// @notice Manages encrypted tickets with lock/unlock functionality using FHEVM
contract TicketVault is SepoliaConfig {
    /// @notice Ticket structure with encrypted seat number
    struct Ticket {
        string eventName;
        string venue;
        string date;
        euint32 encryptedSeatNumber;
        ebool isLocked;
        address owner;
        bool exists;
    }

    /// @notice Mapping from ticket ID to Ticket
    mapping(uint256 => Ticket) private _tickets;

    /// @notice Total number of tickets created
    uint256 private _ticketCount;

    /// @notice Mapping from owner to their ticket IDs
    mapping(address => uint256[]) private _ownerTickets;

    /// @notice Event emitted when a ticket is created
    event TicketCreated(uint256 indexed ticketId, address indexed owner, string eventName);

    /// @notice Event emitted when a ticket is locked/unlocked
    event TicketLockStatusChanged(uint256 indexed ticketId, address indexed owner);

    /// @notice Event emitted when a ticket is transferred
    event TicketTransferred(uint256 indexed ticketId, address indexed from, address indexed to);

    /// @notice Returns the total number of tickets
    function getTicketCount() external view returns (uint256) {
        return _ticketCount;
    }

    /// @notice Returns ticket IDs owned by an address
    /// @param owner The address to query
    function getOwnerTickets(address owner) external view returns (uint256[] memory) {
        return _ownerTickets[owner];
    }

    /// @notice Returns ticket metadata (non-encrypted fields)
    /// @param ticketId The ticket ID to query
    function getTicketMetadata(uint256 ticketId) external view returns (
        string memory eventName,
        string memory venue,
        string memory date,
        address owner,
        bool exists
    ) {
        Ticket storage ticket = _tickets[ticketId];
        return (ticket.eventName, ticket.venue, ticket.date, ticket.owner, ticket.exists);
    }

    /// @notice Returns the encrypted seat number handle
    /// @param ticketId The ticket ID to query
    function getEncryptedSeatNumber(uint256 ticketId) external view returns (euint32) {
        require(_tickets[ticketId].exists, "Ticket does not exist");
        require(_tickets[ticketId].owner == msg.sender, "Not ticket owner");
        return _tickets[ticketId].encryptedSeatNumber;
    }

    /// @notice Returns the encrypted lock status handle
    /// @param ticketId The ticket ID to query
    function getEncryptedLockStatus(uint256 ticketId) external view returns (ebool) {
        require(_tickets[ticketId].exists, "Ticket does not exist");
        require(_tickets[ticketId].owner == msg.sender, "Not ticket owner");
        return _tickets[ticketId].isLocked;
    }

    /// @notice Creates a new ticket with encrypted seat number
    /// @param eventName The name of the event
    /// @param venue The venue of the event
    /// @param date The date of the event
    /// @param encryptedSeat The encrypted seat number
    /// @param seatProof The proof for the encrypted seat
    function createTicket(
        string calldata eventName,
        string calldata venue,
        string calldata date,
        externalEuint32 encryptedSeat,
        bytes calldata seatProof
    ) external returns (uint256) {
        uint256 ticketId = _ticketCount;
        _ticketCount++;

        euint32 seatNumber = FHE.fromExternal(encryptedSeat, seatProof);
        ebool locked = FHE.asEbool(true);

        _tickets[ticketId] = Ticket({
            eventName: eventName,
            venue: venue,
            date: date,
            encryptedSeatNumber: seatNumber,
            isLocked: locked,
            owner: msg.sender,
            exists: true
        });

        _ownerTickets[msg.sender].push(ticketId);

        // Allow contract and owner to access encrypted data
        FHE.allowThis(seatNumber);
        FHE.allow(seatNumber, msg.sender);
        FHE.allowThis(locked);
        FHE.allow(locked, msg.sender);

        emit TicketCreated(ticketId, msg.sender, eventName);

        return ticketId;
    }

    /// @notice Unlocks a ticket (sets isLocked to false)
    /// @param ticketId The ticket ID to unlock
    function unlockTicket(uint256 ticketId) external {
        require(_tickets[ticketId].exists, "Ticket does not exist");
        require(_tickets[ticketId].owner == msg.sender, "Not ticket owner");

        ebool unlocked = FHE.asEbool(false);
        _tickets[ticketId].isLocked = unlocked;

        FHE.allowThis(unlocked);
        FHE.allow(unlocked, msg.sender);

        emit TicketLockStatusChanged(ticketId, msg.sender);
    }

    /// @notice Locks a ticket (sets isLocked to true)
    /// @param ticketId The ticket ID to lock
    function lockTicket(uint256 ticketId) external {
        require(_tickets[ticketId].exists, "Ticket does not exist");
        require(_tickets[ticketId].owner == msg.sender, "Not ticket owner");

        ebool locked = FHE.asEbool(true);
        _tickets[ticketId].isLocked = locked;

        FHE.allowThis(locked);
        FHE.allow(locked, msg.sender);

        emit TicketLockStatusChanged(ticketId, msg.sender);
    }

    /// @notice Transfers a ticket to a new owner
    /// @param ticketId The ticket ID to transfer
    /// @param newOwner The new owner address
    function transferTicket(uint256 ticketId, address newOwner) external {
        require(_tickets[ticketId].exists, "Ticket does not exist");
        require(_tickets[ticketId].owner == msg.sender, "Not ticket owner");
        require(newOwner != address(0), "Invalid new owner");
        require(newOwner != msg.sender, "Cannot transfer to self");

        address previousOwner = _tickets[ticketId].owner;
        _tickets[ticketId].owner = newOwner;

        // Remove from previous owner's list
        uint256[] storage prevOwnerTickets = _ownerTickets[previousOwner];
        for (uint256 i = 0; i < prevOwnerTickets.length; i++) {
            if (prevOwnerTickets[i] == ticketId) {
                prevOwnerTickets[i] = prevOwnerTickets[prevOwnerTickets.length - 1];
                prevOwnerTickets.pop();
                break;
            }
        }

        // Add to new owner's list
        _ownerTickets[newOwner].push(ticketId);

        // Update FHE permissions for new owner
        FHE.allow(_tickets[ticketId].encryptedSeatNumber, newOwner);
        FHE.allow(_tickets[ticketId].isLocked, newOwner);

        emit TicketTransferred(ticketId, previousOwner, newOwner);
    }
}
