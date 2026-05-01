'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLeaderboard, getBounties } from '@/lib/supabase';

interface Entry { wallet: string; name: string; earned: number; count: number; }

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Entry[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLeaderboard(), getBounties({ status: 'completed' })])
      .then(([lb, completed]) => {
        setLeaders(lb);
        setTotalPaid(completed.reduce((s, b) => s + b.reward_usdc, 0));
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function short(addr: string) { return addr ? addr.slice(0, 8) + '…' + addr.slice(-6) : '—'; }
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="wrap" style={{ padding: '48px 32px' }}>

      <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 10 }}>🏆 Leaderboard</h1>
        <p style={{ color: 'rgba(240,242,248,0.45)', fontSize: 16 }}>Top hunters ranked by USDC earned via Arc SDK</p>
      </div>

      {/* Stats */}
      <div className="animate-fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
        {[
          { label: 'Total USDC Paid', value: loading ? '—' : `$${totalPaid.toLocaleString()}`, color: '#10b981', icon: '💵', sub: 'via Arc SDK kit.send()' },
          { label: 'Hunters', value: loading ? '—' : leaders.length.toString(), color: '#6366f1', icon: '👾', sub: 'active builders' },
          { label: 'Completed', value: loading ? '—' : leaders.reduce((s, l) => s + l.count, 0).toString(), color: '#f59e0b', icon: '✅', sub: 'bounties settled' },
        ].map((s, i) => (
          <div key={s.label} className={`card animate-fade-up delay-${i + 1}`} style={{ padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(240,242,248,0.4)', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(240,242,248,0.25)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Podium */}
      {!loading && leaders.length >= 3 && (
        <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 16, marginBottom: 48, alignItems: 'end' }}>
          <div className="card" style={{ padding: 24, textAlign: 'center', border: '1px solid rgba(192,192,192,0.2)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🥈</div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{leaders[1].name || short(leaders[1].wallet)}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(240,242,248,0.3)', marginBottom: 12 }}>{short(leaders[1].wallet)}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#c0c0c0' }}>${leaders[1].earned}</div>
            <div style={{ fontSize: 12, color: 'rgba(240,242,248,0.35)', marginTop: 4 }}>{leaders[1].count} bounties</div>
          </div>
          <div className="card" style={{ padding: 32, textAlign: 'center', border: '1px solid rgba(255,215,0,0.3)', boxShadow: '0 0 40px rgba(255,215,0,0.06)', background: 'rgba(255,215,0,0.04)' }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🥇</div>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{leaders[0].name || short(leaders[0].wallet)}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(240,242,248,0.3)', marginBottom: 12 }}>{short(leaders[0].wallet)}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#ffd700' }}>${leaders[0].earned}</div>
            <div style={{ fontSize: 12, color: 'rgba(240,242,248,0.35)', marginTop: 4 }}>{leaders[0].count} bounties</div>
          </div>
          <div className="card" style={{ padding: 24, textAlign: 'center', border: '1px solid rgba(205,127,50,0.2)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🥉</div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{leaders[2].name || short(leaders[2].wallet)}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(240,242,248,0.3)', marginBottom: 12 }}>{short(leaders[2].wallet)}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#cd7f32' }}>${leaders[2].earned}</div>
            <div style={{ fontSize: 12, color: 'rgba(240,242,248,0.35)', marginTop: 4 }}>{leaders[2].count} bounties</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="animate-fade-up delay-3 card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontWeight: 700, fontSize: 16 }}>All Hunters</div>
        {loading ? (
          <div style={{ padding: 32 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div className="skeleton" style={{ flex: 1, height: 16 }} />
                <div className="skeleton" style={{ width: 80, height: 16 }} />
              </div>
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏆</div>
            <div className="empty-title">No hunters yet</div>
            <div style={{ color: 'rgba(240,242,248,0.4)', fontSize: 14, marginBottom: 24 }}>Be the first to claim and complete a bounty</div>
            <Link href="/bounties" className="btn btn-gradient">Browse Bounties</Link>
          </div>
        ) : leaders.map((entry, i) => (
          <div key={entry.wallet} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < leaders.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
            <div style={{ width: 36, textAlign: 'center', fontSize: i < 3 ? 22 : 14, fontWeight: 800, color: i < 3 ? 'inherit' : 'rgba(240,242,248,0.25)', flexShrink: 0 }}>
              {i < 3 ? medals[i] : `#${i + 1}`}
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `hsl(${parseInt(entry.wallet.slice(2, 8), 16) % 360}, 55%, 40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {(entry.name || entry.wallet)[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{entry.name || 'Anonymous Hunter'}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(240,242,248,0.3)' }}>{short(entry.wallet)}</div>
            </div>
            <div style={{ textAlign: 'center', marginRight: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#6366f1' }}>{entry.count}</div>
              <div style={{ fontSize: 11, color: 'rgba(240,242,248,0.3)' }}>bounties</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: '#10b981' }}>${entry.earned}</div>
              <div style={{ fontSize: 11, color: 'rgba(240,242,248,0.3)' }}>USDC earned</div>
            </div>
          </div>
        ))}
      </div>

      <div className="animate-fade-up delay-4" style={{ marginTop: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Ready to climb the board?</div>
        <div style={{ fontSize: 15, color: 'rgba(240,242,248,0.4)', marginBottom: 24 }}>Claim a bounty and get paid in USDC via Arc SDK</div>
        <Link href="/bounties" className="btn btn-gradient" style={{ fontSize: 16, padding: '14px 36px' }}>Browse Open Bounties →</Link>
      </div>
    </div>
  );
}
