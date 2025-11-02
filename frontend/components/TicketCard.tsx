"use client";

import { Lock, Unlock, QrCode, MapPin, Calendar, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";

interface TicketCardProps {
  id: number;
  event: string;
  venue: string;
  date: string;
  seatNumber: number | null;
  isLocked: boolean | null;
  owner: string;
  isDecrypting: boolean;
  isToggling: boolean;
  onDecrypt: () => void;
  onToggleLock: () => void;
}

export const TicketCard = ({
  id,
  event,
  venue,
  date,
  seatNumber,
  isLocked,
  owner,
  isDecrypting,
  isToggling,
  onDecrypt,
  onToggleLock,
}: TicketCardProps) => {
  const displayOwner = owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : "Unknown";
  const isUnlocked = isLocked === false;
  const needsDecryption = seatNumber === null || isLocked === null;

  return (
    <Card className="relative overflow-hidden bg-[var(--gradient-card)] border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[var(--shadow-glow)] group">
      <div className="p-6">
        {/* QR Code Section */}
        <div className="relative mb-4 rounded-lg bg-secondary/50 p-6 flex items-center justify-center backdrop-blur-sm">
          {!isUnlocked ? (
            <div className="relative">
              <div className="absolute inset-0 backdrop-blur-md bg-background/60 rounded-lg flex items-center justify-center">
                <Lock className="h-12 w-12 text-muted-foreground" />
              </div>
              <QRCodeSVG
                value={`ticket-${id}`}
                size={160}
                level="H"
                fgColor="hsl(217, 91%, 60%)"
                bgColor="transparent"
                className="opacity-20"
              />
            </div>
          ) : (
            <div className="relative">
              <QRCodeSVG
                value={`ticket-${id}-seat-${seatNumber}`}
                size={160}
                level="H"
                fgColor="hsl(217, 91%, 60%)"
                bgColor="transparent"
              />
              <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                <Unlock className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Ticket Info */}
        <div className="space-y-3 mb-4">
          <h3 className="text-xl font-bold text-foreground line-clamp-1">{event}</h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            <span>{venue}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-accent" />
            <span>{date}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <QrCode className="h-4 w-4 text-accent" />
            <span>Seat: {seatNumber !== null ? seatNumber : "Encrypted"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 text-accent" />
            <span className="truncate">Owner: {displayOwner}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {needsDecryption && (
            <Button
              onClick={onDecrypt}
              disabled={isDecrypting}
              variant="outline"
              className="w-full"
            >
              {isDecrypting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Decrypting...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Decrypt Ticket Data
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={onToggleLock}
            disabled={isToggling || needsDecryption}
            variant={isUnlocked ? "secondary" : "default"}
            className="w-full"
          >
            {isToggling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isUnlocked ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Lock Ticket
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Unlock Ticket
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 rounded-full blur-3xl -z-10 group-hover:bg-primary/20 transition-colors" />
    </Card>
  );
};
