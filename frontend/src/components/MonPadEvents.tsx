"use client";
import { useEffect, useState, useCallback } from "react";

interface EventData {
  id: string;
  type: string;
  deployer?: string;
  tokenAddress?: string;
  name?: string;
  symbol?: string;
  supply?: string;
  caller?: string;
  to?: string;
  amount?: string;
  user?: string;
  smartAccount?: string;
  timestamp: string;
}

export default function MonPadEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;

  // Envio GraphQL endpoint
  const ENVIO_GRAPHQL = "https://indexer.dev.hyperindex.xyz/e43f549/v1/graphql";

  // Helper functions
  const formatTokenAmount = (amount: string) => {
    const num = Number(amount);
    if (num >= 1e18) {
      return (num / 1e18).toFixed(2) + " tokens";
    } else if (num >= 1e15) {
      return (num / 1e15).toFixed(2) + " mTokens";
    } else if (num >= 1e12) {
      return (num / 1e12).toFixed(2) + " μTokens";
    } else {
      return num.toString();
    }
  };

  const getExplorerUrl = (address: string) => {
    // Check if it's Monad testnet (chainId 10143) or Sepolia (11155111)
    // For now, default to Monad explorer
    return `https://testnet.monadexplorer.com/address/${address}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  };

  // Pagination logic
  const totalPages = Math.ceil(events.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentEvents = events.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Try simpler query first - order by timestamp desc to get newest events
  const simpleQuery = `
  query {
    MonPad_TokenDeployed(limit: 5, order_by: { timestamp: desc }) {
      deployer
      tokenAddress
      name
      symbol
      supply
      timestamp
    }
    MonPad_TokenMinted(limit: 5, order_by: { timestamp: desc }) {
      caller
      tokenAddress
      to
      amount
      timestamp
    }
    MonPad_TokenTransferred(limit: 5, order_by: { timestamp: desc }) {
      caller
      tokenAddress
      to
      amount
      timestamp
    }
    MonPad_AccountDeployed(limit: 5, order_by: { timestamp: desc }) {
      user
      smartAccount
      timestamp
    }
  }`;


  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(ENVIO_GRAPHQL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: simpleQuery }),
      });
      const response = await res.json();
      
      console.log("Envio API Response:", response);
      
      // Check if response has errors
      if (response.errors) {
        console.error("GraphQL Errors:", response.errors);
        return;
      }
      
      const data = response.data;
      
      // Check if data exists and has the expected structure
      if (!data) {
        console.error("No data in response");
        return;
      }
      
      console.log("Data structure:", Object.keys(data));

      const merged: EventData[] = [];

      const pushEvents = (list: EventData[], type: string) => {
        if (list && Array.isArray(list)) {
          list.forEach((e, index) => {
            console.log(`${type} event ${index}:`, e);
            merged.push({
              ...e,
              id: `${type}-${index}`,
              type,
            });
          });
        }
      };

      // Try different possible field names
      pushEvents(data.MonPad_TokenDeployed || data.TokenDeployed || [], "TokenDeployed");
      pushEvents(data.MonPad_TokenMinted || data.TokenMinted || [], "TokenMinted");
      pushEvents(data.MonPad_TokenTransferred || data.TokenTransferred || [], "TokenTransferred");
      pushEvents(data.MonPad_AccountDeployed || data.AccountDeployed || [], "AccountDeployed");

      merged.sort(
        (a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0)
      );
      setEvents(merged);
      setCurrentPage(1); // Reset to first page when new data loads
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Envio fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [simpleQuery]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <p className="text-gray-400">Loading Envio data...</p>;

  return (
    <div className="p-6 rounded-xl bg-secondary-background border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">MonPad Activity Tracker</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            🔄 Refresh
          </button>
          <span className="text-xs text-gray-400">
            Last: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-gray-400">No events recorded yet</p>
      ) : (
        <>
          <ul className="space-y-3">
            {currentEvents.map((e) => (
            <li
              key={e.id}
              className="p-3 border border-gray-600 rounded-lg bg-gray-700/40"
            >
              <p className="font-semibold text-blue-400">{e.type}</p>
              {e.type === "TokenDeployed" && (
                <p className="text-sm text-gray-300">
                  🧩 {e.name} ({e.symbol}) deployed by{" "}
                  {e.deployer && (
                    <a
                      href={getExplorerUrl(e.deployer)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {formatAddress(e.deployer)}
                    </a>
                  )}
                  , supply {formatTokenAmount(e.supply || "0")}
                </p>
              )}
              {e.type === "TokenMinted" && (
                <p className="text-sm text-gray-300">
                  💥 Mint {formatTokenAmount(e.amount || "0")} to{" "}
                  {e.to && (
                    <a
                      href={getExplorerUrl(e.to)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {formatAddress(e.to)}
                    </a>
                  )}{" "}
                  by{" "}
                  {e.caller && (
                    <a
                      href={getExplorerUrl(e.caller)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {formatAddress(e.caller)}
                    </a>
                  )}
                </p>
              )}
              {e.type === "TokenTransferred" && (
                <p className="text-sm text-gray-300">
                  🔁 Transfer {formatTokenAmount(e.amount || "0")} token to{" "}
                  {e.to && (
                    <a
                      href={getExplorerUrl(e.to)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {formatAddress(e.to)}
                    </a>
                  )}{" "}
                  by{" "}
                  {e.caller && (
                    <a
                      href={getExplorerUrl(e.caller)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {formatAddress(e.caller)}
                    </a>
                  )}
                </p>
              )}
              {e.type === "AccountDeployed" && (
                <p className="text-sm text-gray-300">
                  ⚙️ Account{" "}
                  {e.smartAccount && (
                    <a
                      href={getExplorerUrl(e.smartAccount)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {formatAddress(e.smartAccount)}
                    </a>
                  )}{" "}
                  created by{" "}
                  {e.user && (
                    <a
                      href={getExplorerUrl(e.user)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {formatAddress(e.user)}
                    </a>
                  )}
                </p>
              )}
              <p className="text-xs text-gray-500">
                ⏱ {new Date(Number(e.timestamp) * 1000).toLocaleString()}
              </p>
            </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
              >
                ← Previous
              </button>
              
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
