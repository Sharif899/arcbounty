// Arc SDK wrapper — browser wallet (MetaMask) version
// Uses @circle-fin/app-kit + @circle-fin/adapter-viem-v2
// No private keys needed — user signs with their own MetaMask

import { AppKit } from "@circle-fin/app-kit";
import type { EIP1193Provider } from "viem";

export const ARC_CHAIN = "Arc_Testnet";
export const EXPLORER = "https://testnet.arcscan.app";
export const ARC_RPC = "https://rpc.testnet.arc.network";
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
export const CHAIN_ID = 1657;

// Arc Testnet config for MetaMask
export const ARC_NETWORK_PARAMS = {
  chainId: "0x671", // 1657 in hex
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: [ARC_RPC],
  blockExplorerUrls: [EXPLORER],
};

// Singleton AppKit instance
let kitInstance: AppKit | null = null;

export function getKit(): AppKit {
  if (!kitInstance) kitInstance = new AppKit();
  return kitInstance;
}

// ── Wallet connection ─────────────────────────────────────────────────────────

export interface WalletState {
  address: string;
  connected: boolean;
}

export async function connectWallet(): Promise<string> {
  if (typeof window === "undefined") throw new Error("Browser only");

  const eth = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
  if (!eth) throw new Error("MetaMask not found — please install MetaMask");

  // Request accounts
  const accounts = (await eth.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts.length) throw new Error("No accounts found");

  // Switch to Arc Testnet
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_NETWORK_PARAMS.chainId }],
    });
  } catch (switchError: unknown) {
    // Chain not added yet — add it
    if ((switchError as { code: number }).code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [ARC_NETWORK_PARAMS],
      });
    } else {
      throw switchError;
    }
  }

  return accounts[0];
}

export async function getConnectedAddress(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const eth = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
  if (!eth) return null;
  try {
    const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
    return accounts[0] || null;
  } catch {
    return null;
  }
}

// ── USDC Balance ──────────────────────────────────────────────────────────────

export async function getUsdcBalance(address: string): Promise<string> {
  const data = "0x70a08231" + address.slice(2).padStart(64, "0");
  const res = await fetch(ARC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "eth_call",
      params: [{ to: USDC_ADDRESS, data }, "latest"],
    }),
  });
  const json = await res.json();
  if (!json.result || json.result === "0x") return "0.00";
  return (Number(BigInt(json.result)) / 1e6).toFixed(2);
}

// ── Send USDC via Arc SDK ─────────────────────────────────────────────────────

export interface SendResult {
  txHash: string;
  explorerUrl: string;
  amount: string;
  to: string;
}

export async function sendUsdcWithArcSDK(
  toAddress: string,
  amount: string
): Promise<SendResult> {
  if (typeof window === "undefined") throw new Error("Browser only");

  const eth = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
  if (!eth) throw new Error("MetaMask not found");

  // Dynamically import to avoid SSR issues
  const { createViemAdapterFromProvider } = await import(
    "@circle-fin/adapter-viem-v2"
  );

  const adapter = await createViemAdapterFromProvider({ provider: eth });
  const kit = getKit();

  const sendParams = {
    from: { adapter, chain: ARC_CHAIN as "Arc_Testnet" },
    to: toAddress,
    amount,
    token: "USDC" as const,
  };

  const result = await kit.send(sendParams);

  if (result.state !== "success") {
    throw new Error(`Send failed: ${result.state}`);
  }

  return {
    txHash: result.txHash || "",
    explorerUrl: result.explorerUrl || `${EXPLORER}/tx/${result.txHash}`,
    amount,
    to: toAddress,
  };
}
