"use client";

import { Shield, Github, Twitter } from "lucide-react";
import { Logo } from "./Logo";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Logo />
            <p className="text-sm text-muted-foreground mt-4">
              Blockchain-secured ticketing platform preventing scalping and unauthorized duplication.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Security</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                End-to-End Encryption
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Blockchain Verification
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Anti-Scalping Protection
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Connect</h3>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            2025 Secure MatchTicket Vault. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
