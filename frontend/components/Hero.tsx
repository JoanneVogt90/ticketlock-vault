"use client";

import { Shield } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-50" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 h-72 w-72 bg-primary/20 rounded-full blur-[100px] animate-glow-pulse" />
        <div className="absolute bottom-20 right-10 h-96 w-96 bg-accent/20 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: "1s" }} />
      </div>
      
      <div className="container mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-primary/20 mb-6 animate-slide-up">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground">Blockchain-Secured Tickets</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Unlock Access,<br />Protect Every Seat
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          Event organizers issue encrypted tickets to prevent scalping and unauthorized duplication.
          Only the owner can decrypt and verify entry rights.
        </p>
      </div>
    </section>
  );
};
