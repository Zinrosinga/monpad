"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/config/wagmi";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {Array.isArray(children)
          ? children.map((child, idx) => <div key={idx}>{child}</div>)
          : children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
              borderRadius: '8px',
              minHeight: '125%',
              padding: '16px 20px',
            },
            success: {
              icon: null,
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
