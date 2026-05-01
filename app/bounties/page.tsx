'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBounties, CATEGORIES, STATUS_CONFIG, type Bounty, type BountyCategory, type BountyStatus } from '@/lib/supabase';

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [filtered, setFiltered] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<BountyCategory | 'all'>('all');
  const [status, setStatus] = useState<BountyStatus | 'all'>('open');
  const [sort, setSort] = useState<'newest' | 'reward'>('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getBounties().then(data => { setBounties(data); setFiltered(data.filter(b => b.status === 'open')); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...bounties];
    if (category !== 'all') result = result.filter(b => b.category === category);
    if (status !== 'all') result = result.filter(b => b.status === status);
    if (search) result = result.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.description.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'reward') result.sort((a, b) => b.reward_usdc - a.reward_usdc);
    setFiltered(result);
  }, [bounties, category, status, sort, search]);

  function short(addr: string) { return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : '—'; }
  function timeAgo(ts: string) {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="wrap" style={{ padding: '48px 32px' }}>
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>All Bounties</h1>
          <p style={{ color: 'rgba(240,242,248,0.4)', fontSize: 15 }}>
            {loading ? '...' : `${filtered.length} bounties · paid in USDC via Arc SDK`}
          </p>
        </div>
        <Link href="/post" className="btn btn-gradient">+ Post Bounty</Link>
      </div>

      {/* Filters */}
      <div className="animate-fade-up delay-1 card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" placeholder="🔍 Search bounties…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <select className="select" value={category} onChange={e => setCategory(e.target.value as BountyCategory | 'all')} style={{ width: 'auto' }}>
          <option value="all">All Categories</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
        </select>
        <select className="select" value={status} onChange={e => setStatus(e.target.value as BountyStatus | 'all')} style={{ width: 'auto' }}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="select" value={sort} onChange={e => setSort(e.target.value as 'newest' | 'reward')} style={{ width: 'auto' }}>
          <option value="newest">Newest First</option>
          <option value="reward">Highest Reward</option>
        </select>
      </div>

      {/* Category chips */}
      <div className="animate-fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {[{ key: 'all', emoji: '🎯', label: 'All' }, ...Object.entries(CATEGORIES).map(([k, v]) => ({ key: k, emoji: v.emoji, label: v.label, color: v.color, bg: v.bg }))].map(c => (
          <button key={c.key} onClick={() => setCategory(c.key as BountyCategory | 'all')}
            style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', border: category === c.key ? `1px solid ${'color' in c ? c.color : '#6366f1'}50` : '1px solid transparent', background: category === c.key ? ('bg' in c ? c.bg : 'rgba(99,102,241,0.12)') : 'rgba(255,255,255,0.05)', color: category === c.key ? ('color' in c ? c.color : '#6366f1') : 'rgba(240,242,248,0.5)' }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: 28 }}>
              <div className="skeleton" style={{ height: 18, width: '55%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 20 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton" style={{ height: 32, width: 120 }} />
                <div className="skeleton" style={{ height: 32, width: 80 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon">🎯</div>
          <div className="empty-title">No bounties found</div>
          <div style={{ color: 'rgba(240,242,248,0.4)', fontSize: 14, marginBottom: 24 }}>Try adjusting your filters or post a new bounty</div>
          <Link href="/post" className="btn btn-gradient">Post a Bounty</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {filtered.map((b, i) => {
            const cat = CATEGORIES[b.category];
            const st = STATUS_CONFIG[b.status];
            return (
              <Link key={b.id} href={`/bounties/${b.id}`} style={{ textDecoration: 'none' }} className={`card animate-fade-up delay-${Math.min(i + 1, 4)}`}>
                <div style={{ padding: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30` }}>{cat.emoji} {cat.label}</span>
                      <span className="badge" style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}>{st.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(240,242,248,0.3)', flexShrink: 0 }}>{timeAgo(b.created_at)}</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10, lineHeight: 1.3 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(240,242,248,0.5)', lineHeight: 1.6, marginBottom: 18, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.description}</div>
                  {b.skills?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                      {b.skills.slice(0, 3).map(s => (
                        <span key={s} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: 'rgba(240,242,248,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>{s}</span>
                      ))}
                      {b.skills.length > 3 && <span style={{ fontSize: 11, color: 'rgba(240,242,248,0.3)' }}>+{b.skills.length - 3}</span>}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="reward-pill">${b.reward_usdc} USDC</div>
                    <div style={{ fontSize: 11, color: 'rgba(240,242,248,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {b.poster_name || short(b.poster_wallet)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
