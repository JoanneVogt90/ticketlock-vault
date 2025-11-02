"use client";

import { TicketCard } from "./TicketCard";
import { useTicketVault } from "@/hooks/useTicketVault";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

export const TicketGrid = () => {
  const { isConnected } = useAccount();
  const {
    tickets,
    isLoading,
    isCreating,
    createTicket,
    unlockTicket,
    lockTicket,
    decryptTicket,
    refreshTickets,
    decryptingTickets,
    togglingTickets,
  } = useTicketVault();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTickets();
    setIsRefreshing(false);
  };

  const handleCreateSampleTicket = async () => {
    const events = [
      { name: "Championship Finals 2025", venue: "National Stadium", date: "March 15, 2025" },
      { name: "Summer Music Festival", venue: "City Arena", date: "June 20, 2025" },
      { name: "Tech Conference 2025", venue: "Convention Center", date: "April 10, 2025" },
      { name: "Basketball Playoffs", venue: "Sports Complex", date: "May 5, 2025" },
    ];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    const randomSeat = Math.floor(Math.random() * 500) + 1;
    
    await createTicket(randomEvent.name, randomEvent.venue, randomEvent.date, randomSeat);
  };

  if (!isConnected) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Your Ticket Vault
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect your wallet to view and manage your encrypted tickets.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Your Ticket Vault
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Securely manage your event tickets. Lock to protect, unlock to verify entry.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleCreateSampleTicket}
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Sample Ticket
                </>
              )}
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              variant="outline"
              className="gap-2"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              No tickets found. Create a sample ticket to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                id={ticket.id}
                event={ticket.eventName}
                venue={ticket.venue}
                date={ticket.date}
                seatNumber={ticket.decryptedSeat}
                isLocked={ticket.decryptedLock}
                owner={ticket.owner}
                isDecrypting={decryptingTickets.has(ticket.id)}
                isToggling={togglingTickets.has(ticket.id)}
                onDecrypt={() => decryptTicket(ticket.id)}
                onToggleLock={() => {
                  if (ticket.decryptedLock === false) {
                    lockTicket(ticket.id);
                  } else {
                    unlockTicket(ticket.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
