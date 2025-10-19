"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { createMetaMaskSmartAccount, deploySmartAccount } from "@/config/smartAccount";
import { getChainName, getExplorerUrl } from "@/lib/utils";
import { createPublicClient, createWalletClient, http, custom, parseEther } from "viem";
import { monadTestnet } from "@/config/wagmi";
import { sepolia } from "wagmi/chains";
import { MyTokenABI } from "@/abi/MyTokenABI";
import toast from "react-hot-toast";

export function SmartAccountInfo() {
  const { chainId, address, isConnected } = useAccount();
  
  // Only use supported chains (10143: Monad, 11155111: Sepolia)
  const supportedChainId = chainId === 10143 || chainId === 11155111 ? chainId : null;
  
  const [smartAccountAddress, setSmartAccountAddress] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  
  // Deposit states
  const [selectedToken] = useState<string>("native");
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  // Auto-initialize function (no toast)
  const autoInit = useCallback(async () => {
    if (!supportedChainId) {
      return;
    }

    setIsCreating(true);

    try {
      const { smartAccount, publicClient } = await createMetaMaskSmartAccount(supportedChainId);
      const sa = await smartAccount.getAddress();
      
      const code = await publicClient.getCode({ address: sa });
      const deployed = code && code !== "0x";
      setIsDeployed(deployed || false);
      
      setSmartAccountAddress(sa);
      
    } catch (err: unknown) {
      console.error("Auto init error:", err);
    } finally {
      setIsCreating(false);
    }
  }, [supportedChainId]);

  // User-initiated function (with toast)
  const handleInit = useCallback(async () => {
    if (!supportedChainId) {
      return;
    }

    setIsCreating(true);

    try {
      const { smartAccount, publicClient } = await createMetaMaskSmartAccount(supportedChainId);
      const sa = await smartAccount.getAddress();
      
      const code = await publicClient.getCode({ address: sa });
      const deployed = code && code !== "0x";
      setIsDeployed(deployed || false);
      
      setSmartAccountAddress(sa);
      
      // Show success toast for smart account creation
      toast.success(
        <div className="text-center">
          <div className="mb-2">✅ Smart Account created successfully!</div>
          <div className="text-sm text-gray-300">
            Address: {sa.slice(0, 6)}...{sa.slice(-4)}
          </div>
        </div>,
        {
          duration: 5000,
        }
      );
      
    } catch (err: unknown) {
      const error = err as Error;
      const errorMsg = error.message || String(err);
      console.error("Init error:", err);
      
      toast.error(
        <div className="text-center">
          <div className="mb-2">❌ Smart Account creation failed!</div>
          <div className="text-sm text-gray-300">{errorMsg}</div>
        </div>,
        {
          duration: 5000,
        }
      );
    } finally {
      setIsCreating(false);
    }
  }, [supportedChainId]);


  const handleDeploy = async () => {
    if (!smartAccountAddress) {
      return;
    }

    if (!supportedChainId) {
      return;
    }

    setIsDeploying(true);

    try {
      const result = await deploySmartAccount(supportedChainId);
      
      if (result.alreadyDeployed) {
        setIsDeployed(true);
        toast.success(
          <div className="text-center">
            <div className="mb-2">✅ Smart Account already deployed!</div>
            <div className="text-sm text-gray-300">Smart Account is ready to use</div>
          </div>,
          {
            duration: 5000,
          }
        );
      } else {
        setIsDeployed(true);
        
        const explorerUrl = getExplorerUrl(supportedChainId);
        toast.success(
          <div className="text-center">
            <div className="mb-2">✅ Smart Account deployed successfully!</div>
            <a 
              href={`${explorerUrl}/tx/${result.txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300 block text-center"
            >
              View Transaction →
            </a>
          </div>,
          {
            duration: 5000,
          }
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      const errorMsg = error.message || String(err);
      console.error("Deploy error:", err);
      
      toast.error(
        <div className="text-center">
          <div className="mb-2">❌ Smart Account deployment failed!</div>
          <div className="text-sm text-gray-300">{errorMsg}</div>
        </div>,
        {
          duration: 5000,
        }
      );
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeposit = async () => {
    if (!smartAccountAddress) {
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      return;
    }

    if (!supportedChainId) {
      return;
    }

    setIsDepositing(true);

    try {
      const provider = window.ethereum;
      if (!provider) throw new Error("Wallet not found");

      const chain = supportedChainId === 11155111 ? sepolia : monadTestnet;
      const walletAddress = address as `0x${string}`;

      const walletClient = createWalletClient({
        account: walletAddress,
        chain,
        transport: custom(provider),
      });

      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      let hash: string;

      if (selectedToken === "native") {
        // Deposit native token (MON/ETH)
        hash = await walletClient.sendTransaction({
          to: smartAccountAddress as `0x${string}`,
          value: parseEther(depositAmount),
        });
      } else {
        // Deposit ERC20 token
        hash = await walletClient.writeContract({
          address: selectedToken as `0x${string}`,
          abi: MyTokenABI.abi,
          functionName: "transfer",
          args: [smartAccountAddress as `0x${string}`, parseEther(depositAmount)],
        });
      }


      // Wait for transaction
      await publicClient.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        timeout: 60_000,
      });

      // Show success toast for deposit
      const explorerUrl = getExplorerUrl(supportedChainId);
      toast.success(
        <div className="text-center">
          <div className="mb-2">✅ Deposited successfully!</div>
          <a 
            href={`${explorerUrl}/tx/${hash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300 block text-center"
          >
            View Transaction →
          </a>
        </div>,
        {
          duration: 5000,
        }
      );

      setDepositAmount("");
      
    } catch (err: unknown) {
      const error = err as Error;
      const errorMsg = error.message || String(err);
      console.error("Deposit error:", err);
      
      toast.error(
        <div className="text-center">
          <div className="mb-2">❌ Deposit failed!</div>
          <div className="text-sm text-gray-300">{errorMsg}</div>
        </div>,
        {
          duration: 5000,
        }
      );
    } finally {
      setIsDepositing(false);
    }
  };


  // Auto-initialize Smart Account when component mounts or chainId changes
  useEffect(() => {
    if (isConnected && supportedChainId) {
      // Reset state when chainId changes
      setSmartAccountAddress("");
      setIsDeployed(false);
      
      // Re-initialize with new chainId
      autoInit();
    }
  }, [isConnected, supportedChainId, autoInit]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="p-6 rounded-xl border border-gray-700 bg-secondary-background">
      <h3 className="text-[18px] font-bold mb-4 text-white">
        Smart Account Overview
      </h3>
      
      
      {!smartAccountAddress ? (
        <div>
          <p className="text-white mb-4">
            <strong>Step 1:</strong> Initialize Smart Account (counterfactual address)
          </p>
          {!supportedChainId && (
            <div className="mb-3 p-3 bg-yellow-900/20 border border-yellow-500 rounded">
              <p className="text-[16px] text-yellow-400">⚠️ Please select a network first</p>
            </div>
          )}
          <button
            onClick={handleInit}
            disabled={isCreating || !supportedChainId}
            className={`h-10 px-4 text-white text-[16px] flex items-center justify-center rounded transition-colors ${
              isCreating || !supportedChainId
                ? 'bg-button-inactive opacity-50 cursor-not-allowed'
                : 'bg-button-primary hover:opacity-90'
            }`}
          >
            {isCreating ? "Creating..." : "Initialize Smart Account"}
          </button>
        </div>
      ) : (
        <div>
          {/* Address Row */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-[16px]">Address:</span>
              <span className="text-white text-[16px] font-mono">{smartAccountAddress}</span>
            </div>
          </div>
          
          {/* Network Row */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-[16px]">Network:</span>
              <div className="flex items-center gap-2">
                <span className="text-white text-[16px]">{getChainName(supportedChainId)}</span>
              </div>
            </div>
          </div>
          
          {/* Chain ID Row */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-[16px]">Chain ID:</span>
              <div className="flex items-center gap-2">
                <span className="text-white text-[16px]">{supportedChainId}</span>
              </div>
            </div>
          </div>
          
          {/* Status Row */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-white text-[16px]">Status:</span>
              {isDeployed ? (
                <span className="text-white text-[16px]">Deployed</span>
              ) : (
                <span className="text-yellow-500 text-[16px]">⚠️ Counterfactual</span>
              )}
            </div>
          </div>

          {!isDeployed && (
            <div className="space-y-3 mb-4">
              <p className="text-white text-[16px]">
                <strong>Step 2:</strong> Deploy Smart Account to {getChainName(supportedChainId)}
              </p>
              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className={`w-full h-10 px-4 text-white text-[16px] flex items-center justify-center rounded transition-colors ${
                  isDeploying
                    ? 'bg-button-inactive opacity-50 cursor-not-allowed'
                    : 'bg-button-primary hover:opacity-90'
                }`}
              >
                {isDeploying ? "Deploying..." : "Deploy Smart Account"}
              </button>
              <p className="text-xs text-white opacity-60">
                💡 Deployed via standard transaction. EOA wallet pays gas.
              </p>
            </div>
          )}


          {/* Deposit to Smart Account */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-lg font-bold mb-4 text-white">
              Fund Your Smart Account
            </h4>
            
            {/* Row: Token, Amount and Deposit */}
            <div className="grid grid-cols-3 gap-3 mb-3">
               {/* Token Display */}
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <label className="text-sm text-gray-400">Token</label>
                 </div>
                 <div className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded text-white text-[16px] flex items-center">
                   {supportedChainId === 10143 ? "MON" : supportedChainId === 11155111 ? "ETH" : "Select Network"}
                 </div>
               </div>
              {/* Amount Input */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-[16px] focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Deposit Button */}
              <div className="flex items-end">
                <button
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount}
                  className={`w-full h-10 px-4 text-white text-[16px] flex items-center justify-center rounded transition-colors ${
                    isDepositing || !depositAmount
                      ? 'bg-button-inactive opacity-50 cursor-not-allowed'
                      : 'bg-button-primary hover:opacity-90'
                  }`}
                >
                  {isDepositing ? "Depositing..." : "Deposit"}
                </button>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

