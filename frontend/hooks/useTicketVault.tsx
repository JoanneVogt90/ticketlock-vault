"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useChainId } from "wagmi";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { FhevmInstance } from "@/fhevm/fhevmTypes";

import { TicketVaultAddresses } from "@/abi/TicketVaultAddresses";
import { TicketVaultABI } from "@/abi/TicketVaultABI";

export interface Ticket {
  id: number;
  eventName: string;
  venue: string;
  date: string;
  owner: string;
  encryptedSeatHandle: string | null;
  encryptedLockHandle: string | null;
  decryptedSeat: number | null;
  decryptedLock: boolean | null;
}

interface TicketVaultInfo {
  abi: typeof TicketVaultABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
}

function getTicketVaultByChainId(chainId: number | undefined): TicketVaultInfo {
  if (!chainId) {
    return { abi: TicketVaultABI.abi };
  }

  const entry =
    TicketVaultAddresses[chainId.toString() as keyof typeof TicketVaultAddresses];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: TicketVaultABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: TicketVaultABI.abi,
  };
}

export const useTicketVault = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [decryptingTickets, setDecryptingTickets] = useState<Set<number>>(new Set());
  const [togglingTickets, setTogglingTickets] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const ticketVault = useMemo(() => getTicketVaultByChainId(chainId), [chainId]);

  const isDeployed = useMemo(() => {
    return Boolean(ticketVault.address) && ticketVault.address !== ethers.ZeroAddress;
  }, [ticketVault]);

  // Fetch tickets for current user
  const refreshTickets = useCallback(async () => {
    if (!ticketVault.address || !ethersReadonlyProvider || !address) {
      setTickets([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const contract = new ethers.Contract(
        ticketVault.address,
        ticketVault.abi,
        ethersReadonlyProvider
      );

      const ticketIds: bigint[] = await contract.getOwnerTickets(address);
      const ticketPromises = ticketIds.map(async (id) => {
        const metadata = await contract.getTicketMetadata(id);
        return {
          id: Number(id),
          eventName: metadata.eventName,
          venue: metadata.venue,
          date: metadata.date,
          owner: metadata.owner,
          encryptedSeatHandle: null,
          encryptedLockHandle: null,
          decryptedSeat: null,
          decryptedLock: null,
        } as Ticket;
      });

      const fetchedTickets = await Promise.all(ticketPromises);
      setTickets(fetchedTickets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch tickets";
      console.error("Failed to fetch tickets:", err);
      setError(errorMessage);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [ticketVault.address, ticketVault.abi, ethersReadonlyProvider, address]);

  // Auto-refresh on mount and when dependencies change
  useEffect(() => {
    refreshTickets();
  }, [refreshTickets]);

  // Create a new ticket
  const createTicket = useCallback(
    async (eventName: string, venue: string, date: string, seatNumber: number) => {
      if (!ticketVault.address) {
        const msg = "Cannot create ticket: contract not deployed on this network";
        console.error(msg);
        setError(msg);
        return;
      }
      if (!fhevmInstance) {
        const msg = "Cannot create ticket: FHEVM instance not ready";
        console.error(msg);
        setError(msg);
        return;
      }
      if (!ethersSigner) {
        const msg = "Cannot create ticket: wallet not connected";
        console.error(msg);
        setError(msg);
        return;
      }

      setIsCreating(true);
      setError(null);
      try {
        const contract = new ethers.Contract(
          ticketVault.address,
          ticketVault.abi,
          ethersSigner
        );

        // Encrypt the seat number
        const input = fhevmInstance.createEncryptedInput(
          ticketVault.address,
          ethersSigner.address
        );
        input.add32(seatNumber);
        const enc = await input.encrypt();

        const tx = await contract.createTicket(
          eventName,
          venue,
          date,
          enc.handles[0],
          enc.inputProof
        );
        await tx.wait();

        // Refresh tickets after creation
        await refreshTickets();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create ticket";
        console.error("Failed to create ticket:", err);
        setError(errorMessage);
      } finally {
        setIsCreating(false);
      }
    },
    [ticketVault.address, ticketVault.abi, fhevmInstance, ethersSigner, refreshTickets]
  );

  // Decrypt ticket data
  const decryptTicket = useCallback(
    async (ticketId: number) => {
      if (!ticketVault.address || !fhevmInstance || !ethersSigner) {
        return;
      }

      setDecryptingTickets((prev) => new Set(prev).add(ticketId));
      try {
        const contract = new ethers.Contract(
          ticketVault.address,
          ticketVault.abi,
          ethersSigner
        );

        // Get encrypted handles
        const encryptedSeat = await contract.getEncryptedSeatNumber(ticketId);
        const encryptedLock = await contract.getEncryptedLockStatus(ticketId);

        // Get decryption signature
        const sig = await FhevmDecryptionSignature.loadOrSign(
          fhevmInstance,
          [ticketVault.address as `0x${string}`],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!sig) {
          console.error("Failed to get decryption signature");
          return;
        }

        // Decrypt seat number
        const decryptedValues = await fhevmInstance.userDecrypt(
          [
            { handle: encryptedSeat, contractAddress: ticketVault.address },
            { handle: encryptedLock, contractAddress: ticketVault.address },
          ],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        const decryptedSeat = Number(decryptedValues[encryptedSeat]);
        const decryptedLock = Boolean(decryptedValues[encryptedLock]);

        // Update ticket state
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  encryptedSeatHandle: encryptedSeat,
                  encryptedLockHandle: encryptedLock,
                  decryptedSeat,
                  decryptedLock,
                }
              : t
          )
        );
      } catch (error) {
        console.error("Failed to decrypt ticket:", error);
      } finally {
        setDecryptingTickets((prev) => {
          const next = new Set(prev);
          next.delete(ticketId);
          return next;
        });
      }
    },
    [ticketVault.address, ticketVault.abi, fhevmInstance, ethersSigner, fhevmDecryptionSignatureStorage]
  );

  // Unlock ticket
  const unlockTicket = useCallback(
    async (ticketId: number) => {
      if (!ticketVault.address || !ethersSigner) {
        return;
      }

      setTogglingTickets((prev) => new Set(prev).add(ticketId));
      try {
        const contract = new ethers.Contract(
          ticketVault.address,
          ticketVault.abi,
          ethersSigner
        );

        const tx = await contract.unlockTicket(ticketId);
        await tx.wait();

        // Re-decrypt to get updated lock status
        await decryptTicket(ticketId);
      } catch (error) {
        console.error("Failed to unlock ticket:", error);
      } finally {
        setTogglingTickets((prev) => {
          const next = new Set(prev);
          next.delete(ticketId);
          return next;
        });
      }
    },
    [ticketVault.address, ticketVault.abi, ethersSigner, decryptTicket]
  );

  // Lock ticket
  const lockTicket = useCallback(
    async (ticketId: number) => {
      if (!ticketVault.address || !ethersSigner) {
        return;
      }

      setTogglingTickets((prev) => new Set(prev).add(ticketId));
      try {
        const contract = new ethers.Contract(
          ticketVault.address,
          ticketVault.abi,
          ethersSigner
        );

        const tx = await contract.lockTicket(ticketId);
        await tx.wait();

        // Re-decrypt to get updated lock status
        await decryptTicket(ticketId);
      } catch (error) {
        console.error("Failed to lock ticket:", error);
      } finally {
        setTogglingTickets((prev) => {
          const next = new Set(prev);
          next.delete(ticketId);
          return next;
        });
      }
    },
    [ticketVault.address, ticketVault.abi, ethersSigner, decryptTicket]
  );

  return {
    tickets,
    isLoading,
    isCreating,
    isDeployed,
    contractAddress: ticketVault.address,
    createTicket,
    decryptTicket,
    unlockTicket,
    lockTicket,
    refreshTickets,
    decryptingTickets,
    togglingTickets,
    fhevmStatus,
    error,
  };
};
