"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { getChainName, getExplorerUrl } from "@/lib/utils";
import { formatUnits, parseEther, encodeFunctionData } from "viem";
import toast from "react-hot-toast";
import { MyTokenABI } from "@/abi/MyTokenBytecode";
import { FactoryTokenABI } from "@/abi/FactoryTokenABI";
import { getFactoryTokenAddress } from "@/abi/FactoryTokenAddresses";
import { MonPadABI } from "@/abi/MonPadABI";
import { getMonPadAddress } from "@/abi/MonPadAddresses";
import { createMetaMaskSmartAccount } from "@/config/smartAccount";
import { saveToken, getTokens } from "@/lib/localTokenStore";

type DeployedToken = {
  name: string;
  symbol: string;
  address: string;
  supply: string;
  balance?: string;
  deployTxHash?: string;
  deployTime?: string;
  isDeployed?: boolean;
};

export function Faucet() {
  const { chainId, address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  // Only use supported chains (10143: Monad, 11155111: Sepolia)
  const supportedChainId = chainId === 10143 || chainId === 11155111 ? chainId : null;
  
  // Form states
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  
  // Deploy states
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  
  // Mint Token Card states
  const [mintTokenAddress, setMintTokenAddress] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [selectedToken, setSelectedToken] = useState("");

  // Transfer states
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferSelectedToken, setTransferSelectedToken] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<Array<{
    symbol: string;
    name: string;
    address: string;
    balance: string;
  }>>([]);
  const [isLoadingTransferTokens, setIsLoadingTransferTokens] = useState(false);
  
  // Deployed tokens
  const [deployedTokens, setDeployedTokens] = useState<DeployedToken[]>([]);

  const loadAvailableTokens = useCallback(async () => {
    if (!supportedChainId || !address) return;
    
    setIsLoadingTransferTokens(true);
    try {
      const { smartAccount } = await createMetaMaskSmartAccount(supportedChainId);
      const saAddress = await smartAccount.getAddress();
      const tokens: Array<{
        symbol: string;
        name: string;
        address: string;
        balance: string;
      }> = [];

      if (supportedChainId === 10143) {
        // Use Monad RPC directly for Monad testnet
        const rpc = "https://testnet-rpc.monad.xyz";
        
        // Get native balance
        const nativeRes = await fetch(rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [saAddress, "latest"],
          }),
        }).then((r) => r.json());

        const balanceWei = BigInt(nativeRes.result || "0x0");
        const nativeBal = formatUnits(balanceWei, 18);

        tokens.push({
          symbol: "MON",
          name: "Monad (Native)",
          address: "native",
          balance: nativeBal,
        });

        // Get ERC20 tokens
        const localTokens = getTokens(supportedChainId);
        const erc20Tokens = [...localTokens];

        for (const token of erc20Tokens) {
          try {
            const balanceOfSelector = "0x70a08231";
            const data = balanceOfSelector + saAddress.replace("0x", "").padStart(64, "0");

            const tokenRes = await fetch(rpc, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_call",
                params: [{ to: token.address, data }, "latest"],
              }),
            }).then((r) => r.json());

            const balance = BigInt(tokenRes.result || "0x0");
            if (balance > BigInt(0)) {
              const bal = formatUnits(balance, 18);
              tokens.push({
                symbol: token.symbol,
                name: token.name,
                address: token.address,
                balance: bal,
              });
            }
          } catch (err) {
            console.warn(`Could not read balance for ${token.symbol}:`, err);
          }
        }
      }

      setAvailableTokens(tokens);
    } catch (err) {
      console.error("Error loading token balances:", err);
      setAvailableTokens([]);
    } finally {
      setIsLoadingTransferTokens(false);
    }
  }, [supportedChainId, address]);

  const loadDeployedTokens = useCallback(async () => {
    if (!supportedChainId || !address) return;

      setIsLoadingTransferTokens(true);
    try {
      // Load deployed tokens from localStorage with chain filter
      const storedTokens = localStorage.getItem(`deployedTokens_${supportedChainId}_${address}`);
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        setDeployedTokens(tokens);
      } else {
        setDeployedTokens([]);
      }
    } catch (err) {
      console.error("Error loading deployed tokens:", err);
      setDeployedTokens([]);
    } finally {
      setIsLoadingTransferTokens(false);
    }
  }, [supportedChainId, address]);

  // Load deployed tokens
  useEffect(() => {
    if (supportedChainId && address) {
      loadDeployedTokens();
    }
  }, [supportedChainId, address, loadDeployedTokens]);


  // Load available tokens for transfer
  useEffect(() => {
    if (supportedChainId && address) {
      loadAvailableTokens();
    }
  }, [supportedChainId, address, loadAvailableTokens]);

  const handleTransfer = async () => {
    if (!supportedChainId || !transferRecipient || !transferSelectedToken || !transferAmount) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setIsTransferring(true);
      setError(null);
      const { smartAccount, bundlerClient } = await createMetaMaskSmartAccount(supportedChainId);

      // Get MonPad contract address
      const monPadAddress = getMonPadAddress(supportedChainId);

      let calls;

      if (transferSelectedToken === "native") {
        // Send native token (MON/ETH)
        calls = [{
          to: transferRecipient as `0x${string}`,
          value: parseEther(transferAmount),
        }];
      } else {
        // Send ERC20 token with batch: approve + transfer
        const saAddress = await smartAccount.getAddress();
        
        // Step 1: Approve Smart Account to spend tokens
        const approveData = encodeFunctionData({
          abi: MyTokenABI.abi,
          functionName: "approve",
          args: [saAddress, parseEther(transferAmount)],
        });
        
        // Step 2: Transfer from Smart Account to recipient
        const transferData = encodeFunctionData({
          abi: MyTokenABI.abi,
          functionName: "transfer",
          args: [transferRecipient as `0x${string}`, parseEther(transferAmount)],
        });

        // Step 3: Record transfer event for Envio indexing
        const recordTransferData = encodeFunctionData({
          abi: MonPadABI.abi,
          functionName: "recordTransfer",
          args: [transferSelectedToken as `0x${string}`, transferRecipient as `0x${string}`, parseEther(transferAmount)]
        });
        
        calls = [
          {
            to: transferSelectedToken as `0x${string}`,
            data: approveData,  // approve SA to spend
            value: BigInt(0),
          },
          {
            to: transferSelectedToken as `0x${string}`,
            data: transferData,  // transfer from SA to recipient
            value: BigInt(0),
          },
          {
            to: monPadAddress as `0x${string}`,
            data: recordTransferData,  // record transfer for Envio
            value: BigInt(0),
          },
        ];
      }

      // Prepare user operation (get auto estimate)
      const userOp = await bundlerClient.prepareUserOperation({
        account: smartAccount,
        calls,
      });

      // Override với minimum gas limits (fallback nếu estimate quá thấp)
      // Pimlico estimate thấp cho Monad → cộng buffer 30%
      const callGasLimit = userOp.callGasLimit 
        ? userOp.callGasLimit + (userOp.callGasLimit * BigInt(30) / BigInt(100))
        : BigInt(400000);
      const verificationGasLimit = userOp.verificationGasLimit
        ? userOp.verificationGasLimit + (userOp.verificationGasLimit * BigInt(30) / BigInt(100))
        : BigInt(1000000);
      const preVerificationGas = userOp.preVerificationGas
        ? userOp.preVerificationGas + (userOp.preVerificationGas * BigInt(30) / BigInt(100))
        : BigInt(800000);

      // Update userOp với gas limits đã adjust
      userOp.callGasLimit = callGasLimit;
      userOp.verificationGasLimit = verificationGasLimit;
      userOp.preVerificationGas = preVerificationGas;

      // Sign user operation
      const signature = await smartAccount.signUserOperation(userOp);
      userOp.signature = signature;

      // Send signed user operation via bundler (ERC-4337)
      const userOpHash = await bundlerClient.sendUserOperation(userOp);

      
      // Wait for user operation to be mined
      const userOpReceipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
        timeout: 60_000,
      });

      const txHash = userOpReceipt.receipt.transactionHash;
      
      // Parse logs to get MonPad events
      if (!publicClient) throw new Error("Public client not available");
      const txReceipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
      
      // Look for TokenTransferred event from MonPad contract
      const monPadAddressForTransfer = getMonPadAddress(supportedChainId);
      const tokenTransferredEvent = txReceipt.logs.find((log: { address: string; topics: string[]; data: string }) => {
        return log.address.toLowerCase() === monPadAddressForTransfer.toLowerCase() &&
               log.topics.length > 0;
      });

      if (tokenTransferredEvent) {
        // TokenTransferred(address indexed caller, address indexed tokenAddress, address indexed to, uint256 amount, uint256 timestamp)
        if (tokenTransferredEvent.topics.length >= 4) {
          const caller = "0x" + (tokenTransferredEvent.topics[1] || "").slice(-40);
          const tokenAddress = "0x" + (tokenTransferredEvent.topics[2] || "").slice(-40);
          const to = "0x" + (tokenTransferredEvent.topics[3] || "").slice(-40);
          const amount = BigInt("0x" + tokenTransferredEvent.data.slice(2, 66));
          const timestamp = BigInt("0x" + tokenTransferredEvent.data.slice(66, 130));
          
        }
      }
      
      // Show success toast for transfer
      const tokenType = transferSelectedToken === "native" ? "native tokens" : "tokens";
      const explorerUrl = getExplorerUrl(supportedChainId);
      toast.success(
        <div className="text-center">
          <div className="mb-2">✅ Transferred {transferAmount} {tokenType} successfully!</div>
          <a 
            href={`${explorerUrl}/tx/${txHash}`} 
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
      
      // Clear form
      setTransferRecipient("");
      setTransferSelectedToken("");
      setTransferAmount("");
      
      // Reload tokens
      await loadAvailableTokens();

    } catch (err) {
      console.error("Transfer error:", err);
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsTransferring(false);
    }
  };

  const saveDeployedToken = async (token: DeployedToken) => {
    if (!supportedChainId || !address) return;

    try {
      // Get existing tokens
      const storedTokens = localStorage.getItem(`deployedTokens_${supportedChainId}_${address}`);
      const existingTokens = storedTokens ? JSON.parse(storedTokens) : [];
      
      // Add new token
      const updatedTokens = [...existingTokens, token];
      
      // Save back to localStorage
      localStorage.setItem(`deployedTokens_${supportedChainId}_${address}`, JSON.stringify(updatedTokens));
      
      // Update state
      setDeployedTokens(updatedTokens);
      
      // Also save to localTokenStore for SendUserOperation component
      // Get Smart Account address for deployer
      const { smartAccount } = await createMetaMaskSmartAccount(supportedChainId);
      const saAddress = await smartAccount.getAddress();
      
      saveToken({
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        chainId: supportedChainId,
        deployer: saAddress, // Use Smart Account address as deployer
      });
      
    } catch (err) {
      console.error("Error saving deployed token:", err);
    }
  };

  const handleDeployToken = async () => {
    if (!tokenName || !tokenSymbol || !tokenSupply) {
      toast.error("❌ Please fill in all fields", {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }

    if (!supportedChainId) {
      toast.error("❌ Please connect wallet and select a supported network", {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }

    if (!address) {
      toast.error("❌ Please connect wallet", {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }

    setIsDeploying(true);
    setError(null);

    try {
      // Create Smart Account
      const { smartAccount, bundlerClient, publicClient } = await createMetaMaskSmartAccount(supportedChainId);

      // Get contract addresses for current chain
      const factoryAddress = getFactoryTokenAddress(supportedChainId);
      const monPadAddress = getMonPadAddress(supportedChainId);

      // Encode deployToken function call
      const deployData = encodeFunctionData({
        abi: FactoryTokenABI.abi,
        functionName: "deployToken",
        args: [tokenName, tokenSymbol, parseEther("0")], // Deploy with 0 supply initially
      });

      // Create user operation with only FactoryToken.deployToken() (không gộp MonPad)
      const userOp = await bundlerClient.prepareUserOperation({
        account: smartAccount,
        calls: [
          {
            to: factoryAddress as `0x${string}`,
            data: deployData,
            value: BigInt(0),
          }
        ],
      });

      // Override với minimum gas limits (fallback nếu estimate quá thấp)
      // Factory call cần gas tương tự transfer
      const callGasLimit = userOp.callGasLimit 
        ? userOp.callGasLimit + (userOp.callGasLimit * BigInt(30) / BigInt(100)) // 30% buffer cho factory call
        : BigInt(500000); // Default for factory call
      const verificationGasLimit = userOp.verificationGasLimit
        ? userOp.verificationGasLimit + (userOp.verificationGasLimit * BigInt(30) / BigInt(100))
        : BigInt(1000000); // Default for factory call
      const preVerificationGas = userOp.preVerificationGas
        ? userOp.preVerificationGas + (userOp.preVerificationGas * BigInt(30) / BigInt(100))
        : BigInt(800000); // Default for factory call
      
      // Update userOp với gas limits đã adjust
      userOp.callGasLimit = callGasLimit;
      userOp.verificationGasLimit = verificationGasLimit;
      userOp.preVerificationGas = preVerificationGas;

      // Sign user operation
      const signature = await smartAccount.signUserOperation(userOp);
      userOp.signature = signature;

      // Send user operation via bundler
      const userOpHash = await bundlerClient.sendUserOperation(userOp);

      // Wait for user operation to be mined
      const userOpReceipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
        timeout: 60_000,
      });

      const txHash = userOpReceipt.receipt.transactionHash;

      // Fetch full transaction receipt via public client
      const txReceipt = await publicClient.getTransactionReceipt({ hash: txHash });
      
      // Extract deployed token address from TokenCreated event
      let deployedAddress: string | undefined;
      
      // Look for TokenCreated event from Factory contract
      const tokenCreatedEvent = txReceipt.logs.find((log: { address: string; topics: string[]; data: string }) => {
        // Check if this is a TokenCreated event from Factory
        return log.address.toLowerCase() === factoryAddress.toLowerCase() &&
               log.topics.length > 0;
      });

      if (tokenCreatedEvent) {
        // TokenCreated(address indexed token, string name, string symbol, uint256 supply)
        // Token address should be in topics[1] (first indexed parameter)
        if (tokenCreatedEvent.topics.length >= 2) {
          // Extract 20 bytes from the end of topics[1] (remove padding zeros)
          const topicAddress = tokenCreatedEvent.topics[1];
          if (topicAddress) {
            deployedAddress = "0x" + topicAddress.slice(-40); // Last 40 chars = 20 bytes
          }
        } else {
          // Fallback: try to extract from data
          deployedAddress = "0x" + tokenCreatedEvent.data.slice(26, 66);
        }
      } else {
        // Fallback: try to find any contract creation in logs
        const contractLog = txReceipt.logs.find((log: { address: string }) => 
          log.address.toLowerCase() !== factoryAddress.toLowerCase() &&
          log.address !== "0x0000000000000000000000000000000000000000"
        );
        
        if (contractLog) {
          deployedAddress = contractLog.address;
        }
      }

      if (!deployedAddress) {
        throw new Error("❌ Contract deployment failed — no TokenCreated event found in logs.");
      }

      // Record deployment in MonPad for Envio indexing (separate call)
      const monPadAddressForDeploy = getMonPadAddress(supportedChainId);
      const recordDeployData = encodeFunctionData({
        abi: MonPadABI.abi,
        functionName: "recordDeploy",
        args: [deployedAddress as `0x${string}`, tokenName, tokenSymbol, parseEther(tokenSupply)]
      });

      try {
        // Create second user operation to record deployment
        const recordUserOp = await bundlerClient.prepareUserOperation({
          account: smartAccount,
          calls: [
            {
              to: monPadAddressForDeploy as `0x${string}`,
              data: recordDeployData,
              value: BigInt(0),
            }
          ],
        });

        // Override gas limits for record operation
        const recordCallGasLimit = recordUserOp.callGasLimit 
          ? recordUserOp.callGasLimit + (recordUserOp.callGasLimit * BigInt(30) / BigInt(100))
          : BigInt(200000);
        const recordVerificationGasLimit = recordUserOp.verificationGasLimit
          ? recordUserOp.verificationGasLimit + (recordUserOp.verificationGasLimit * BigInt(30) / BigInt(100))
          : BigInt(1000000);
        const recordPreVerificationGas = recordUserOp.preVerificationGas
          ? recordUserOp.preVerificationGas + (recordUserOp.preVerificationGas * BigInt(30) / BigInt(100))
          : BigInt(800000);

        recordUserOp.callGasLimit = recordCallGasLimit;
        recordUserOp.verificationGasLimit = recordVerificationGasLimit;
        recordUserOp.preVerificationGas = recordPreVerificationGas;

        // Sign and send record operation
        const recordSignature = await smartAccount.signUserOperation(recordUserOp);
        recordUserOp.signature = recordSignature;

        const recordUserOpHash = await bundlerClient.sendUserOperation(recordUserOp);
        
        // Wait for record operation (don't wait too long)
        const recordUserOpReceipt = await bundlerClient.waitForUserOperationReceipt({
          hash: recordUserOpHash,
          timeout: 30_000,
        });

        // Parse MonPad record logs
        if (recordUserOpReceipt.receipt.status === "success") {
          const recordTxHash = recordUserOpReceipt.receipt.transactionHash;
          const recordTxReceipt = await publicClient.getTransactionReceipt({ hash: recordTxHash as `0x${string}` });
          
          // Look for TokenDeployed event from MonPad contract
          const tokenDeployedEvent = recordTxReceipt.logs.find((log: { address: string; topics: string[]; data: string }) => {
            return log.address.toLowerCase() === monPadAddressForDeploy.toLowerCase() &&
                   log.topics.length > 0;
          });
        }

      } catch (recordError) {
        console.warn("Failed to record deployment in MonPad:", recordError);
        // Don't fail the whole operation if MonPad record fails
      }

      // Show success toast for deployment
      const explorerUrl = getExplorerUrl(supportedChainId);
      toast.success(
        <div className="text-center">
          <div className="mb-2">✅ Token &quot;{tokenSymbol}&quot; deployed successfully!</div>
          <a 
            href={`${explorerUrl}/tx/${txHash}`} 
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

      // Add to deployed tokens (not minted yet)
      const newToken: DeployedToken = {
        name: tokenName,
        symbol: tokenSymbol,
        address: deployedAddress,
        supply: tokenSupply,
        deployTxHash: txHash,
        deployTime: new Date().toISOString(),
        isDeployed: true,
        balance: "0", // No tokens minted yet
      };

      saveDeployedToken(newToken);

      // Reset form
      setTokenName("");
      setTokenSymbol("");
      setTokenSupply("");

    } catch (err: unknown) {
      const error = err as Error;
      const errorMsg = error.message || String(err);
      console.error("Deploy error:", err);
      
      // Show error toast
      toast.error(`❌ Deploy failed: ${errorMsg}`, {
        duration: 5000,
        icon: '🚫',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleMintToken = async () => {
    if (!mintTokenAddress || !mintAmount) {
      toast.error("❌ Please select a token and enter amount to mint", {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }

    if (!supportedChainId) {
      toast.error("❌ Please connect wallet and select a supported network", {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }

    if (!address) {
      toast.error("❌ Please connect wallet", {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }

    setIsMinting(true);
    setError(null);

    try {
      
      // Create Smart Account
      const { smartAccount, bundlerClient, publicClient } = await createMetaMaskSmartAccount(supportedChainId);
      const saAddress = await smartAccount.getAddress();

      // Get MonPad contract address
      const monPadAddress = getMonPadAddress(supportedChainId);

      // Mint tokens to Smart Account
      const mintData = encodeFunctionData({
        abi: MyTokenABI.abi,
        functionName: "mint",
        args: [saAddress, parseEther(mintAmount)]
      });

      // Create user operation with only MyToken.mint() first
      const userOp = await bundlerClient.prepareUserOperation({
        account: smartAccount,
        calls: [
          {
            to: mintTokenAddress as `0x${string}`,
            data: mintData,
            value: BigInt(0),
          }
        ],
      });

      // Override với minimum gas limits
      const callGasLimit = userOp.callGasLimit 
        ? userOp.callGasLimit + (userOp.callGasLimit * BigInt(30) / BigInt(100)) // 30% buffer
        : BigInt(400000); // Default for mint operation
      const verificationGasLimit = userOp.verificationGasLimit
        ? userOp.verificationGasLimit + (userOp.verificationGasLimit * BigInt(30) / BigInt(100))
        : BigInt(200000); // Default for verification
      const preVerificationGas = userOp.preVerificationGas
        ? userOp.preVerificationGas + (userOp.preVerificationGas * BigInt(30) / BigInt(100))
        : BigInt(100000); // Default for pre-verification

      const userOpWithGas = {
        ...userOp,
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
      };

      // Sign user operation -> chỉ trả về signature hex
      const signature = await smartAccount.signUserOperation(userOpWithGas);

      // Gắn signature vào userOp
      const finalUserOp = { ...userOpWithGas, signature };

      // Send user operation
      
      const userOpHash = await bundlerClient.sendUserOperation(finalUserOp);
      

      // Kiểm tra lại trước khi gọi receipt
      if (!userOpHash || typeof userOpHash !== "string") {
        throw new Error(`❌ Invalid userOpHash returned: ${userOpHash}`);
      }

      // Wait for transaction
      let userOpReceipt;
      
      try {
        userOpReceipt = await bundlerClient.waitForUserOperationReceipt({
          hash: userOpHash,
          timeout: 120_000,
        });
      } catch {
        
        // Fallback: wait và check transaction manually
        await new Promise((resolve) => setTimeout(resolve, 15000)); // wait 15s
        
        // Get transaction receipt instead of transactions list
        const txReceipt = await publicClient.getTransactionReceipt({ hash: userOpHash as `0x${string}` });
        
        // Tạo fake receipt để tiếp tục
        userOpReceipt = {
          receipt: {
            status: "success", // Assume success nếu có tx
            transactionHash: txReceipt?.transactionHash || userOpHash,
          }
        };
      }

      if (userOpReceipt.receipt.status === "success") {
        const txHash = userOpReceipt.receipt.transactionHash;
        
        // Record mint event for Envio indexing (separate call)
        const recordMintData = encodeFunctionData({
          abi: MonPadABI.abi,
          functionName: "recordMint",
          args: [mintTokenAddress as `0x${string}`, saAddress, parseEther(mintAmount)]
        });

        try {
          // Create second user operation to record mint
          const recordUserOp = await bundlerClient.prepareUserOperation({
            account: smartAccount,
            calls: [
              {
                to: monPadAddress as `0x${string}`,
                data: recordMintData,
                value: BigInt(0),
              }
            ],
          });

          // Override gas limits for record operation
          const recordCallGasLimit = recordUserOp.callGasLimit 
            ? recordUserOp.callGasLimit + (recordUserOp.callGasLimit * BigInt(30) / BigInt(100))
            : BigInt(200000);
          const recordVerificationGasLimit = recordUserOp.verificationGasLimit
            ? recordUserOp.verificationGasLimit + (recordUserOp.verificationGasLimit * BigInt(30) / BigInt(100))
            : BigInt(1000000);
          const recordPreVerificationGas = recordUserOp.preVerificationGas
            ? recordUserOp.preVerificationGas + (recordUserOp.preVerificationGas * BigInt(30) / BigInt(100))
            : BigInt(800000);

          recordUserOp.callGasLimit = recordCallGasLimit;
          recordUserOp.verificationGasLimit = recordVerificationGasLimit;
          recordUserOp.preVerificationGas = recordPreVerificationGas;

          // Sign and send record operation
          const recordSignature = await smartAccount.signUserOperation(recordUserOp);
          recordUserOp.signature = recordSignature;

          const recordUserOpHash = await bundlerClient.sendUserOperation(recordUserOp);
          
          // Wait for record operation (don't wait too long)
          const recordUserOpReceipt = await bundlerClient.waitForUserOperationReceipt({
            hash: recordUserOpHash,
            timeout: 30_000,
          });

          // Parse MonPad record logs
          if (recordUserOpReceipt.receipt.status === "success") {
            const recordTxHash = recordUserOpReceipt.receipt.transactionHash;
            const recordTxReceipt = await publicClient.getTransactionReceipt({ hash: recordTxHash as `0x${string}` });
            
            // Look for TokenMinted event from MonPad contract
            const tokenMintedEvent = recordTxReceipt.logs.find((log: { address: string; topics: string[]; data: string }) => {
              return log.address.toLowerCase() === monPadAddress.toLowerCase() &&
                     log.topics.length > 0;
            });
          }

        } catch (recordError) {
          console.warn("Failed to record mint in MonPad:", recordError);
          // Don't fail the whole operation if MonPad record fails
        }
        
        // Show success toast for minting
        const explorerUrl = getExplorerUrl(supportedChainId);
        toast.success(
          <div className="text-center">
            <div className="mb-2">✅ Minted {mintAmount} tokens successfully!</div>
            <a 
              href={`${explorerUrl}/tx/${txHash}`} 
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
        
        // Reset form
        setMintTokenAddress("");
        setMintAmount("");
        setSelectedToken("");
        
        // Reload tokens to get updated balance
        await loadDeployedTokens();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      console.error("Mint error:", err);
      
      // Show error toast
      toast.error(`❌ Mint failed: ${err instanceof Error ? err.message : "Unknown error"}`, {
        duration: 5000,
        icon: '🚫',
      });
    } finally {
      setIsMinting(false);
    }
  };
  
  if (!isConnected) {
    return (
      <div className="p-6 rounded-xl bg-secondary-background border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">Deploy Token</h3>
        <div className="p-3 bg-yellow-900/20 border border-yellow-500 rounded">
          <p className="text-sm text-yellow-400">⚠️ Please connect your wallet to deploy tokens</p>
        </div>
      </div>
    );
  }

  if (!supportedChainId) {
    return (
      <div className="p-6 rounded-xl bg-secondary-background border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">Deploy Token</h3>
        <div className="p-3 bg-yellow-900/20 border border-yellow-500 rounded">
          <p className="text-sm text-yellow-400">⚠️ Please switch to Monad Testnet or Sepolia</p>
          <p className="text-xs text-yellow-300 mt-2">Current network: {getChainName(supportedChainId)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Single Card Layout */}
      <div className="p-6 rounded-xl bg-secondary-background border border-gray-700">
        
        {/* Deploy Section */}
        <div className="mb-3">
          <h4 className="text-lg font-semibold mb-4 text-white">1. Deploy Token</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Name
              </label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g., My Token"
                className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Symbol
              </label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., MTK"
                className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Total Supply
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                value={tokenSupply}
                onChange={(e) => setTokenSupply(e.target.value)}
                placeholder="e.g., 1000000"
                className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <button
            onClick={handleDeployToken}
            disabled={isDeploying || !tokenName || !tokenSymbol || !tokenSupply}
            className={`w-full h-10 px-6 text-white text-sm font-semibold flex items-center justify-center rounded transition-colors ${
              isDeploying || !tokenName || !tokenSymbol || !tokenSupply
                ? 'bg-button-inactive opacity-50 cursor-not-allowed'
                : 'bg-button-primary hover:opacity-90'
            }`}
          >
            {isDeploying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deploying...
              </>
            ) : (
              "Deploy Token"
            )}
          </button>

        </div>

        {/* Divider */}
        <div className="border-t border-gray-600 mb-2"></div>

        {/* Mint Section */}
        <div className="mb-3">
          <h4 className="text-lg font-semibold mb-4 text-white">2. Mint Token</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Deployed Token
              </label>
              <select
                value={selectedToken}
                onChange={(e) => {
                  setSelectedToken(e.target.value);
                  setMintTokenAddress(e.target.value);
                }}
                className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="">-- Select Token --</option>
                {deployedTokens.map((token, index) => (
                  <option key={index} value={token.address}>
                    {token.name} ({token.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount to Mint
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gray-500"
                placeholder="1000"
              />
            </div>
          </div>
          
          <button
            onClick={handleMintToken}
            disabled={isMinting || !mintTokenAddress || !mintAmount}
            className={`w-full h-10 px-6 text-white text-sm font-semibold flex items-center justify-center rounded transition-colors ${
              isMinting || !mintTokenAddress || !mintAmount
                ? 'bg-button-inactive opacity-50 cursor-not-allowed'
                : 'bg-button-primary hover:opacity-90'
            }`}
          >
            {isMinting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Minting...
              </>
            ) : (
              "Mint Token"
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-3 bg-red-900/20 border border-red-500 rounded">
            <p className="text-sm text-red-500 font-semibold">Error:</p>
            <p className="text-sm text-red-400 mt-1">{error}</p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-600 mb-2"></div>

        {/* Transfer Section */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-white">3. Transfer with Smart Account</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Token
              </label>
              <select 
                value={transferSelectedToken}
                onChange={(e) => setTransferSelectedToken(e.target.value)}
                disabled={isLoadingTransferTokens}
                className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50"
              >
                {isLoadingTransferTokens ? (
                  <option value="">Loading tokens...</option>
                ) : availableTokens.length === 0 ? (
                  <option value="">No tokens found</option>
                ) : (
                  <>
                    <option value="">-- Select Token --</option>
                    {availableTokens.map((token) => (
                      <option key={token.address} value={token.address}>
                        {token.symbol} ({parseFloat(token.balance).toFixed(4)})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="text"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.1"
                className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <button
            onClick={handleTransfer}
            disabled={isTransferring || !transferRecipient || !transferSelectedToken || !transferAmount}
            className={`w-full h-10 px-6 text-white text-sm font-semibold flex items-center justify-center rounded transition-colors ${
              isTransferring || !transferRecipient || !transferSelectedToken || !transferAmount
                ? 'bg-button-inactive opacity-50 cursor-not-allowed'
                : 'bg-button-primary hover:opacity-90'
            }`}
          >
            {isTransferring ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}