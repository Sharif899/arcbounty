'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getBounty, createClaim, acceptClaim, CATEGORIES, STATUS_CONFIG, type Bounty, type Claim } from '@/lib/supabase';
import { getConnectedAddress, connectWallet, sendUsdcWithArcSDK, EXPLORER } from '@/lib/arcSdk';

export default function BountyDetailPage() {
  const { id } = useParams() as { id: string };
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState('');
  const [showClaim, setShowClaim] = useState(false);

  // Claim form
  const [claimerName, setClaimerName] = useState('');
  const [claimDesc, setClaimDesc] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Pay state
  const [paying, setPaying] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<{ txHash: string; explorerUrl: string; claimId: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    getBounty(id).then(setBounty).catch(() => setError('Bounty not found')).finally(() => setLoading(false));
    getConnectedAddress().then(addr => { if (addr) setWallet(addr); });
  }, [id]);

  async function handleConnect() {
    try {
      const addr = await connectWallet();
      setWallet(addr);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    }
  }

  async function submitClaim() {
    if (!wallet) { setError('Connect your wallet first'); return; }
    if (!claimDesc) { setError('Describe how you will complete this'); return; }
    setSubmittingClaim(true);
    setError('');
    try {
      await createClaim({ bounty_id: id, claimer_wallet: wallet, claimer_name: claimerName, description: claimDesc, github_url: githubUrl || null });
      setClaimed(true);
      setShowClaim(false);
      const updated = await getBounty(id);
      setBounty(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit claim');
    } finally {
      setSubmittingClaim(false);
    }
  }

  async function payHunter(claim: Claim) {
    if (!wallet) { await handleConnect(); return; }
    setPaying(claim.id);
    setError('');
    try {
      // Arc SDK sends USDC to hunter
      const result = await sendUsdcWithArcSDK(claim.claimer_wallet, bounty!.reward_usdc.toString());
      // Update DB
      await acceptClaim(claim.id, id, result.txHash);
      setPaySuccess({ txHash: result.txHash, explorerUrl: result.explorerUrl, claimId: claim.id });
      const updated = await getBounty(id);
      setBounty(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Payment failed — check your USDC balance');
    } finally {
      setPaying(null);
    }
  }

  function short(addr: string) { return addr ? addr.slice(0, 8) + '…' + addr.slice(-6) : '—'; }
  function timeAgo(ts: string) {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  if (loading) return (
    <div className="wrap" style={{ padding: '48px 32px' }}>
      <div className="skeleton" style={{ height: 40, width: 300, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 20, width: '60%' }} />
    </div>
  );

  if (!bounty) return (
    <div className="wrap" style={{ padding: '48px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Bounty not found</div>
      <Link href="/bounties" className="btn btn-gradient" style={{ marginTop: 16 }}>← Back to Bounties</Link>
    </div>
  );

  const cat = CATEGORIES[bounty.category];
  const st = STATUS_CONFIG[bounty.status];
  const isPoster = wallet.toLowerCase() === bounty.poster_wallet.toLowerCase();

  return (
    <div className="wrap" style={{ padding: '48px 32px' }}>
      <Link href="/bounties" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(240,242,248,0.4)', textDecoration: 'none', marginBottom: 32 }}>
        ← Back to Bounties
      </Link>

      {/* Pay success banner */}
      {paySuccess && (
        <div className="animate-fade-in" style={{ marginBottom: 28, padding: '20px 24px', borderRadius: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>🎉</span>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#10b981' }}>
              ${bounty.reward_usdc} USDC sent via Arc SDK!
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(240,242,248,0.5)', marginBottom: 10 }}>
            Settlement confirmed on Arc Network in under 1 second.
          </div>
          <a href={paySuccess.explorerUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>
            ↗ View on Arcscan: {paySuccess.txHash.slice(0, 24)}…
          </a>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 24, padding: '14px 18px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

        {/* Main */}
        <div>
          <div className="animate-fade-up">
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30` }}>{cat.emoji} {cat.label}</span>
              <span className="badge" style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}>{st.label}</span>
            </div>

            <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 20 }}>
              {bounty.title}
            </h1>

            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'rgba(240,242,248,0.4)', marginBottom: 32, flexWrap: 'wrap' }}>
              {bounty.poster_name && <span>👤 {bounty.poster_name}</span>}
              <span className="mono">📍 {short(bounty.poster_wallet)}</span>
              <span>🕐 {timeAgo(bounty.created_at)}</span>
              {bounty.deadline && <span>⏰ Deadline: {new Date(bounty.deadline).toLocaleDateString()}</span>}
            </div>

            <div className="card" style={{ padding: 28, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📋 Description</div>
              <div style={{ fontSize: 15, color: 'rgba(240,242,248,0.65)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{bounty.description}</div>
            </div>

            {bounty.skills?.length > 0 && (
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🔧 Required Skills</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {bounty.skills.map(s => (
                    <span key={s} style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1', fontSize: 13, fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Claims list */}
            {bounty.claims && bounty.claims.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>
                  {bounty.claims.length} Submission{bounty.claims.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bounty.claims.map(claim => (
                    <div key={claim.id} className="card" style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                            {claim.claimer_name || 'Anonymous Hunter'}
                          </div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(240,242,248,0.35)' }}>
                            {claim.claimer_wallet}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, color: 'rgba(240,242,248,0.35)' }}>{timeAgo(claim.created_at)}</span>
                          <span className="badge" style={{
                            background: claim.status === 'accepted' ? 'rgba(16,185,129,0.12)' : claim.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                            color: claim.status === 'accepted' ? '#10b981' : claim.status === 'rejected' ? '#ef4444' : '#f59e0b',
                          }}>{claim.status}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: 14, color: 'rgba(240,242,248,0.6)', marginBottom: 12, lineHeight: 1.6 }}>{claim.description}</div>

                      {claim.github_url && (
                        <a href={claim.github_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 13, color: '#6366f1', display: 'block', marginBottom: 12 }}>
                          ↗ {claim.github_url}
                        </a>
                      )}

                      {/* Pay button — only for poster, only on pending claims */}
                      {isPoster && claim.status === 'pending' && bounty.status === 'open' && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                          <button
                            className="btn btn-green"
                            onClick={() => payHunter(claim)}
                            disabled={paying === claim.id}
                            style={{ fontSize: 14 }}
                          >
                            {paying === claim.id
                              ? <><span className="spinner" /> Sending USDC via Arc SDK…</>
                              : `⚡ Accept & Pay $${bounty.reward_usdc} USDC`
                            }
                          </button>
                          <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(240,242,248,0.35)' }}>
                            Arc SDK kit.send() → {claim.claimer_name || short(claim.claimer_wallet)} · settles in &lt;1s
                          </div>
                        </div>
                      )}

                      {claim.pay_tx_hash && (
                        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', fontSize: 12 }}>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Paid via Arc SDK · </span>
                          <a href={`${EXPLORER}/tx/${claim.pay_tx_hash}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6366f1', fontSize: 11 }}>
                            ↗ {claim.pay_tx_hash.slice(0, 20)}…
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 88 }}>
          <div className="animate-fade-up delay-1 card" style={{ padding: 28, marginBottom: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'rgba(240,242,248,0.4)', marginBottom: 8 }}>REWARD</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: '#10b981', letterSpacing: '-0.03em' }}>
                ${bounty.reward_usdc}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(240,242,248,0.4)', marginTop: 4 }}>USDC · Arc Network</div>
              <div style={{ fontSize: 12, color: '#6366f1', marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                via @circle-fin/app-kit
              </div>
            </div>

            <div className="divider" style={{ marginBottom: 20 }} />

            {claimed ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#10b981', marginBottom: 6 }}>Claim Submitted!</div>
                <div style={{ fontSize: 13, color: 'rgba(240,242,248,0.4)', lineHeight: 1.5 }}>The bounty poster will review your submission and pay via Arc SDK.</div>
              </div>
            ) : bounty.status === 'open' && !isPoster ? (
              <>
                {!wallet ? (
                  <button className="btn btn-gradient" style={{ width: '100%', marginBottom: 10 }} onClick={handleConnect}>
                    🦊 Connect to Claim
                  </button>
                ) : (
                  <button className="btn btn-gradient" style={{ width: '100%', marginBottom: 10 }}
                    onClick={() => setShowClaim(!showClaim)}>
                    {showClaim ? 'Cancel' : '🙋 Claim This Bounty'}
                  </button>
                )}

                {showClaim && wallet && (
                  <div className="animate-fade-in" style={{ marginTop: 16 }}>
                    <div className="divider" style={{ marginBottom: 16 }} />
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Your Submission</div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="label">Your Name (optional)</label>
                      <input className="input" value={claimerName} onChange={e => setClaimerName(e.target.value)} placeholder="John Doe" style={{ fontSize: 13 }} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="label">How will you complete this? *</label>
                      <textarea className="textarea" value={claimDesc} onChange={e => setClaimDesc(e.target.value)}
                        placeholder="Describe your approach…" style={{ minHeight: 80, fontSize: 13 }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label className="label">GitHub / Portfolio URL</label>
                      <input className="input" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/…" style={{ fontSize: 13 }} />
                    </div>
                    <button className="btn btn-gradient" style={{ width: '100%' }} onClick={submitClaim} disabled={submittingClaim}>
                      {submittingClaim ? <><span className="spinner" /> Submitting…</> : 'Submit Claim'}
                    </button>
                    <div style={{ fontSize: 11, color: 'rgba(240,242,248,0.3)', marginTop: 8, textAlign: 'center' }}>
                      USDC pays to: {short(wallet)}
                    </div>
                  </div>
                )}
              </>
            ) : bounty.status === 'completed' ? (
              <div style={{ textAlign: 'center', padding: '8px 0', color: '#10b981', fontWeight: 700 }}>
                ✓ Bounty Completed & Paid
              </div>
            ) : isPoster ? (
              <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(240,242,248,0.4)', padding: '8px 0' }}>
                You posted this bounty. Review submissions above.
              </div>
            ) : null}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,242,248,0.35)', letterSpacing: '0.1em', marginBottom: 14 }}>
              ARC SDK PAYMENT INFO
            </div>
            {[
              ['SDK', '@circle-fin/app-kit'],
              ['Method', 'kit.send()'],
              ['Settlement', '< 1 second'],
              ['Token', 'USDC'],
              ['Network', 'Arc Testnet'],
              ['Chain ID', '1657'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'rgba(240,242,248,0.4)' }}>{k}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#10b981', fontSize: 11 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
