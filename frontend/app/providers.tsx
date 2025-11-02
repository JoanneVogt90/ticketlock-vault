"use client";

import "@rainbow-me/rainbowkit/styles.css";
import type { ReactNode } from "react";
import { useState } from "react";

import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { createConfig, http, WagmiProvider } from "wagmi";
import { injected } from "wagmi/connectors";
import { hardhat, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  // Build readonly RPC map for FHEVM usage (avoid routing reads via wallet)
  const localUrl = process.env.NEXT_PUBLIC_LOCAL_RPC_URL || "http://127.0.0.1:8545";
  const sepoliaUrl =
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
    "https://rpc.sepolia.org";
  const readonlyRpcs: Record<number, string> = {
    31337: localUrl,
  };

  // Wagmi + RainbowKit
  const transports = {
    [hardhat.id]: http(localUrl),
    [sepolia.id]: http(sepoliaUrl),
  } as const;

  const chains = [hardhat, sepolia] as const;

  const wagmiConfig = createConfig({
    chains,
    connectors: [injected()],
    transports,
    ssr: true,
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "hsl(217 91% 60%)",
            accentColorForeground: "hsl(222 47% 11%)",
            borderRadius: "medium",
          })}
        >
          <MetaMaskProvider>
            <MetaMaskEthersSignerProvider initialMockChains={readonlyRpcs}>
              <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
            </MetaMaskEthersSignerProvider>
          </MetaMaskProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
