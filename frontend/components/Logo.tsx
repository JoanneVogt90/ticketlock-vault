"use client";

import { Shield, QrCode } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Shield className="h-8 w-8 text-primary" />
        <QrCode className="absolute -bottom-1 -right-1 h-4 w-4 text-accent" />
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        SecureTicket
      </span>
    </div>
  );
};
