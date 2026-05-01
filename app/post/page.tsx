'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBounty, CATEGORIES, type BountyCategory } from '@/lib/supabase';
import { getConnectedAddress, connectWallet, getUsdcBalance } from '@/lib/arcSdk';

export default function PostBountyPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState('');
  const [balance, setBalance] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [category, setCategory] = useState<BountyCategory>('smart_contract');
  const [posterName, setPosterName] = useState('');
  const [skills, setSkills] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    getConnectedAddress().then(async (addr) => {
      if (addr) {
        setWallet(addr);
        const bal = await getUsdcBalance(addr);
        setBalance(bal);
      }
    });
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setWallet(addr);
      const bal = await getUsdcBalance(addr);
      setBalance(bal);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  }

  async function submit() {
    if (!wallet) { setError('Connect your wallet first'); return; }
    if (!title || !description || !reward) { setError('Title, description and reward are required'); return; }
    const rewardNum = parseFloat(reward);
    if (isNaN(rewardNum) || rewardNum <= 0) { setError('Enter a valid USDC reward'); return; }
    if (parseFloat(balance) < rewardNum) { setError(`Insufficient balance. You have $${balance} USDC`); return; }

    setSubmitting(true);
    setError('');

    try {
      const bounty = await createBounty({
        title,
        description,
        reward_usdc: rewardNum,
        category,
        poster_wallet: wallet,
        poster_name: posterName,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        deadline: deadline || null,
      });
      router.push(`/bounties/${bounty.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to post bounty');
      setSubmitting(false);
    }
  }

  const cat = CATEGORIES[category];

  return (
    <div className="wrap" style={{ padding: '48px 32px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div className="animate-fade-up" style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Post a Bounty
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(240,242,248,0.5)', lineHeight: 1.7 }}>
            Describe the task, set a USDC reward. When you accept a submission, the Arc SDK sends USDC to the hunter's wallet in under 1 second.
          </p>
        </div>

        {/* Wallet section */}
        <div className="animate-fade-up delay-1 card" style={{ padding: 24, marginBottom: 24 }}>
          {wallet ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(240,242,248,0.4)', marginBottom: 4 }}>CONNECTED WALLET</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#6366f1' }}>{wallet}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'rgba(240,242,248,0.4)', marginBottom: 4 }}>USDC BALANCE</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>${balance}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, color: 'rgba(240,242,248,0.5)' }}>
                Connect your MetaMask wallet to post a bounty
              </div>
              <button className="btn btn-gradient" onClick={handleConnect} disabled={connecting}>
                {connecting ? <><span className="spinner" /> Connecting…</> : '🦊 Connect MetaMask'}
              </button>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="animate-fade-up delay-2 card" style={{ padding: 36 }}>
          {error && (
            <div style={{ marginBottom: 24, padding: '14px 18px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 14 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label className="label">Bounty Title *</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Build a USDC payment widget for Arc" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Description *</label>
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe exactly what needs to be done, acceptance criteria, and technical requirements…"
              style={{ minHeight: 140 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="label">Category *</label>
              <select className="select" value={category} onChange={e => setCategory(e.target.value as BountyCategory)}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reward (USDC) *</label>
              <input className="input" type="number" value={reward} onChange={e => setReward(e.target.value)}
                placeholder="50" min="1" step="1" />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Required Skills (comma separated)</label>
            <input className="input" value={skills} onChange={e => setSkills(e.target.value)} placeholder="Solidity, React, Viem, TypeScript" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="label">Your Name (optional)</label>
              <input className="input" value={posterName} onChange={e => setPosterName(e.target.value)} placeholder="Your name or org" />
            </div>
            <div>
              <label className="label">Deadline (optional)</label>
              <input className="input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {/* Preview */}
          {(title || reward) && (
            <div style={{ marginBottom: 24, padding: 20, borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 10, letterSpacing: '0.08em' }}>PREVIEW</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge" style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30`, marginBottom: 6, display: 'inline-flex' }}>
                    {cat.emoji} {cat.label}
                  </span>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{title || 'Your bounty title'}</div>
                </div>
                <div className="reward-pill">${reward || '0'} USDC</div>
              </div>
            </div>
          )}

          {/* Arc SDK note */}
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', fontSize: 13, color: 'rgba(240,242,248,0.5)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚡</span>
            <span>When you accept a submission, the <strong style={{ color: '#10b981' }}>Arc SDK</strong> will call <code style={{ fontFamily: 'JetBrains Mono, monospace', color: '#06b6d4', fontSize: 12 }}>kit.send()</code> to transfer USDC to the hunter's wallet on Arc Testnet — settlement in under 1 second.</span>
          </div>

          <button className="btn btn-gradient" style={{ width: '100%', fontSize: 16, padding: '15px' }}
            onClick={submit} disabled={submitting || !wallet}>
            {submitting ? <><span className="spinner" /> Posting…</> : '🚀 Post Bounty'}
          </button>
        </div>
      </div>
    </div>
  );
}
