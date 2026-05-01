# Arc Bounty Board

A developer bounty board for Arc Network. Post tasks, claim work, get paid in USDC — powered by the official **Arc SDK** (`@circle-fin/app-kit`).

**Stack:** Next.js 14 + Supabase + Arc SDK + MetaMask → Vercel

---

## How USDC Payment Works

When a bounty poster accepts a submission:

```typescript
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

const kit = new AppKit();
const adapter = await createViemAdapterFromProvider({ provider: window.ethereum });

const result = await kit.send({
  from: { adapter, chain: "Arc_Testnet" },
  to: hunterWalletAddress,
  amount: bountyRewardUsdc,
  token: "USDC",
});
// Settles in < 1 second ⚡
```

That's it. Real USDC. Real Arc Network. Real settlement.

---

## Step 1 — Supabase Setup

1. Go to **https://supabase.com** → New Project
2. Open **SQL Editor** and run:

```sql
create table bounties (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  reward_usdc numeric not null,
  category text not null default 'other',
  status text not null default 'open',
  poster_wallet text not null,
  poster_name text default '',
  skills text[] default '{}',
  deadline date,
  tx_hash text,
  created_at timestamptz default now()
);

create table claims (
  id uuid default gen_random_uuid() primary key,
  bounty_id uuid references bounties(id) on delete cascade,
  claimer_wallet text not null,
  claimer_name text default '',
  description text not null,
  github_url text,
  status text not null default 'pending',
  pay_tx_hash text,
  created_at timestamptz default now()
);

alter table bounties enable row level security;
alter table claims enable row level security;

create policy "Public read bounties" on bounties for select using (true);
create policy "Public insert bounties" on bounties for insert with check (true);
create policy "Public update bounties" on bounties for update using (true);
create policy "Public read claims" on claims for select using (true);
create policy "Public insert claims" on claims for insert with check (true);
create policy "Public update claims" on claims for update using (true);
```

3. Seed demo data (optional):

```sql
insert into bounties (title, description, reward_usdc, category, poster_wallet, poster_name, skills) values
('Build a USDC Payment Widget', 'Create a React component for sending USDC on Arc. Support wallet connection, amount input, recipient address, and show tx confirmation.', 150, 'frontend', '0xF2EE634847d39161ec7De7879d7d0d241B932Ad4', 'Arc Team', ARRAY['React', 'Viem', 'TypeScript']),
('Write Arc Integration Guide', 'Comprehensive developer guide: Arc RPC, Hardhat deployment, USDC transfers, onchain data. Must include working code examples.', 75, 'documentation', '0xF2EE634847d39161ec7De7879d7d0d241B932Ad4', 'Arc Team', ARRAY['Technical Writing', 'Solidity']),
('ERC-8183 Security Audit', 'Security audit of AgenticCommerce contract. Review for reentrancy, access control, economic attacks. Deliver full report.', 500, 'security', '0xE30C78226640a169097669BA4ADAD416Faa6521c', 'Arc Foundation', ARRAY['Solidity', 'Security']),
('Arc Hardhat Plugin', 'Build a Hardhat plugin that auto-configures Arc Testnet/Mainnet, includes USDC addresses, and adds helper tasks.', 200, 'tooling', '0xF2EE634847d39161ec7De7879d7d0d241B932Ad4', 'Arc Team', ARRAY['Node.js', 'Hardhat', 'TypeScript']);
```

4. Go to **Settings → API** → copy URL and anon key

---

## Step 2 — Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 3 — MetaMask Setup

Add Arc Testnet to MetaMask:
- **Network Name:** Arc Testnet
- **RPC URL:** https://rpc.testnet.arc.network
- **Chain ID:** 1657
- **Currency:** USDC
- **Explorer:** https://testnet.arcscan.app

Get testnet USDC: **https://faucet.circle.com** → select Arc Testnet

---

## Step 4 — Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Step 5 — Deploy to Vercel

```bash
vercel
```

Add environment variables when prompted:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Arc SDK Used

```
@circle-fin/app-kit@1.4.1
@circle-fin/adapter-viem-v2@1.8.3
```
