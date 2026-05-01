'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBounties, CATEGORIES, STATUS_CONFIG, type Bounty } from '@/lib/supabase';

export default function HomePage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, totalUsdc: 0, completed: 0 });

  useEffect(() => {
    getBounties().then(data => {
      setBounties(data.slice(0, 6));
      setStats({
        total: data.length,
        open: data.filter(b => b.status === 'open').length,
        totalUsdc: data.reduce((s, b) => s + b.reward_usdc, 0),
        completed: data.filter(b => b.status === 'completed').length,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function short(addr: string) { return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : '—'; }

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '80px 0 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, left: '5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="wrap animate-fade-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 28, fontSize: 13, fontWeight: 600, color: '#6366f1' }}>
            <span className="live-dot" style={{ background: '#6366f1', boxShadow: '0 0 8px #6366f1', width: 6, height: 6 }} />
            Powered by Arc SDK · Real USDC · Sub-second settlement
          </div>

          <h1 style={{ fontSize: 72, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 24 }}>
            Dev Bounties.<br />
            <span className="gradient-text">Paid in USDC.</span>
          </h1>

          <p style={{ fontSize: 20, color: 'rgba(240,242,248,0.5)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 44px' }}>
            Post tasks, claim work, get paid — using the Arc SDK to send real USDC onchain in under a second. No middleman.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/bounties" className="btn btn-gradient" style={{ fontSize: 16, padding: '15px 36px' }}>
              Browse Bounties →
            </Link>
            <Link href="/post" className="btn btn-outline" style={{ fontSize: 16, padding: '15px 36px' }}>
              Post a Bounty
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 0 64px' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Bounties', value: loading ? '—' : stats.total.toString(), color: '#6366f1', icon: '🎯' },
              { label: 'Open Now', value: loading ? '—' : stats.open.toString(), color: '#10b981', icon: '🟢' },
              { label: 'USDC Posted', value: loading ? '—' : `$${stats.totalUsdc.toLocaleString()}`, color: '#f59e0b', icon: '💵' },
              { label: 'Completed', value: loading ? '—' : stats.completed.toString(), color: '#06b6d4', icon: '✅' },
            ].map((s, i) => (
              <div key={s.label} className={`card animate-fade-up delay-${i + 1}`} style={{ padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', color: s.color, marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'rgba(240,242,248,0.4)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '64px 0', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>How It Works</h2>
            <p style={{ color: 'rgba(240,242,248,0.4)', fontSize: 16 }}>Real USDC. Real Arc SDK. Real onchain settlement.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { step: '01', icon: '🦊', title: 'Connect MetaMask', desc: 'Connect to Arc Testnet with one click. Arc SDK adapter handles the wallet connection.', color: '#f59e0b' },
              { step: '02', icon: '📝', title: 'Post a Bounty', desc: 'Describe the task and set a USDC reward. Stored in Supabase, visible to all builders.', color: '#6366f1' },
              { step: '03', icon: '⚡', title: 'Claim & Deliver', desc: 'Builders claim bounties and submit their work with a GitHub link or deliverable.', color: '#06b6d4' },
              { step: '04', icon: '💵', title: 'Arc SDK Pays', desc: 'Accept the work — Arc SDK calls kit.send() and USDC hits the hunter\'s wallet in under 1 second.', color: '#10b981' },
            ].map((s, i) => (
              <div key={s.step} className={`card animate-fade-up delay-${i + 1}`} style={{ padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <span style={{ fontSize: 30 }}>{s.icon}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: s.color, opacity: 0.5 }}>{s.step}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(240,242,248,0.45)', lineHeight: 1.6 }}>{s.desc}</div>
                <div style={{ marginTop: 16, height: 3, borderRadius: 2, background: s.color, opacity: 0.4 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arc SDK callout */}
      <section style={{ padding: '48px 0' }}>
        <div className="wrap">
          <div style={{ borderRadius: 20, padding: '32px 40px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.07))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.12em', marginBottom: 8 }}>BUILT WITH ARC SDK</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>Real USDC payments via @circle-fin/app-kit</h3>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(240,242,248,0.5)', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '12px 16px', lineHeight: 1.7 }}>
                <div style={{ color: '#6366f1' }}>// Arc SDK send — 3 lines of code</div>
                <div><span style={{ color: '#f59e0b' }}>const</span> result = <span style={{ color: '#10b981' }}>await</span> kit.<span style={{ color: '#06b6d4' }}>send</span>({'{'}</div>
                <div>&nbsp;&nbsp;from: {'{'} adapter, chain: <span style={{ color: '#ec4899' }}>&quot;Arc_Testnet&quot;</span> {'}'},</div>
                <div>&nbsp;&nbsp;to: hunterWallet, amount: bountyReward,</div>
                <div>&nbsp;&nbsp;token: <span style={{ color: '#ec4899' }}>&quot;USDC&quot;</span></div>
                <div>{'}'});</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              {[
                { label: 'Settlement', value: '< 1 second' },
                { label: 'Gas token', value: 'USDC' },
                { label: 'Chain', value: 'Arc Testnet' },
                { label: 'SDK', value: '@circle-fin/app-kit' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 13 }}>
                  <span style={{ color: 'rgba(240,242,248,0.4)' }}>{r.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#10b981', fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Latest bounties */}
      <section style={{ padding: '48px 0 80px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em' }}>Latest Bounties</h2>
            <Link href="/bounties" className="btn btn-ghost" style={{ fontSize: 13 }}>View all →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[1,2,3].map(i => (
                <div key={i} className="card" style={{ padding: 24 }}>
                  <div className="skeleton" style={{ height: 18, width: '55%', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 20 }} />
                  <div className="skeleton" style={{ height: 32, width: 100 }} />
                </div>
              ))}
            </div>
          ) : bounties.length === 0 ? (
            <div className="card empty">
              <div className="empty-icon">🎯</div>
              <div className="empty-title">No bounties yet</div>
              <div style={{ marginBottom: 24, color: 'rgba(240,242,248,0.4)', fontSize: 14 }}>Be the first to post a bounty</div>
              <Link href="/post" className="btn btn-gradient">Post First Bounty</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {bounties.map((b, i) => {
                const cat = CATEGORIES[b.category];
                const st = STATUS_CONFIG[b.status];
                return (
                  <Link key={b.id} href={`/bounties/${b.id}`} style={{ textDecoration: 'none' }} className={`card animate-fade-up delay-${i + 1}`}>
                    <div style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                        <span className="badge" style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30` }}>{cat.emoji} {cat.label}</span>
                        <span className="badge" style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}>{st.label}</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8, lineHeight: 1.3 }}>{b.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(240,242,248,0.5)', lineHeight: 1.5, marginBottom: 18, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.description}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="reward-pill">${b.reward_usdc} USDC</div>
                        <div style={{ fontSize: 11, color: 'rgba(240,242,248,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>by {short(b.poster_wallet)}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
