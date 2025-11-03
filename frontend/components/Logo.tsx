"use client";

import Image from "next/image";

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/favicon.svg"
        alt="SecureTicket Logo"
        width={32}
        height={32}
        className="h-8 w-8"
      />
      <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        SecureTicket
      </span>
    </div>
  );
};
