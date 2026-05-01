'use client';
import { useState, useEffect } from 'react';
import { connectWallet, getConnectedAddress, getUsdcBalance, ARC_NETWORK_PARAMS } from '@/lib/arcSdk';

export default function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already connected
    getConnectedAddress().then(async (addr) => {
      if (addr) {
        setAddress(addr);
        const bal = await getUsdcBalance(addr);
        setBalance(bal);
      }
    });

    // Listen for account changes
    if (typeof window !== 'undefined' && (window as Window & { ethereum?: { on?: (e: string, cb: (a: string[]) => void) => void } }).ethereum?.on) {
    const eth = (window as unknown as { ethereum: { on: (e: string, cb: (a: string[]) => void) => void } }).ethereum;
      eth.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          const bal = await getUsdcBalance(accounts[0]);
          setBalance(bal);
        } else {
          setAddress(null);
          setBalance(null);
        }
      });
    }
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError('');
    try {
      const addr = await connectWallet();
      setAddress(addr);
      const bal = await getUsdcBalance(addr);
      setBalance(bal);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  }

  function short(addr: string) {
    return addr.slice(0, 6) + '…' + addr.slice(-4);
  }

  if (address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {balance !== null && (
          <div style={{
            padding: '6px 14px', borderRadius: 20,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            fontSize: 13, fontWeight: 700, color: '#10b981',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            ${balance} USDC
          </div>
        )}
        <div style={{
          padding: '7px 16px', borderRadius: 10,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
          fontSize: 13, fontWeight: 600, color: '#6366f1',
          fontFamily: 'JetBrains Mono, monospace',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span className="live-dot" style={{ width: 6, height: 6, background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          {short(address)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        className="btn btn-gradient"
        onClick={handleConnect}
        disabled={connecting}
        style={{ fontSize: 13, padding: '9px 20px' }}
      >
        {connecting ? <><span className="spinner" /> Connecting…</> : '🦊 Connect MetaMask'}
      </button>
      {error && (
        <div style={{ position: 'absolute', top: 72, right: 32, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#ef4444', maxWidth: 280 }}>
          {error}
        </div>
      )}
    </div>
  );
}
