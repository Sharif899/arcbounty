import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export type BountyStatus = "open" | "in_progress" | "completed" | "cancelled";
export type BountyCategory =
  | "smart_contract" | "frontend" | "tooling"
  | "documentation" | "security" | "design" | "other";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward_usdc: number;
  category: BountyCategory;
  status: BountyStatus;
  poster_wallet: string;
  poster_name: string;
  skills: string[];
  deadline: string | null;
  created_at: string;
  tx_hash: string | null;
  claims?: Claim[];
}

export interface Claim {
  id: string;
  bounty_id: string;
  claimer_wallet: string;
  claimer_name: string;
  description: string;
  github_url: string | null;
  status: "pending" | "accepted" | "rejected";
  pay_tx_hash: string | null;
  created_at: string;
}

export const CATEGORIES: Record<BountyCategory, { label: string; color: string; bg: string; emoji: string }> = {
  smart_contract: { label: "Smart Contract", color: "#6366f1", bg: "rgba(99,102,241,0.12)", emoji: "📜" },
  frontend:       { label: "Frontend",       color: "#06b6d4", bg: "rgba(6,182,212,0.12)",  emoji: "🎨" },
  tooling:        { label: "Tooling",         color: "#f59e0b", bg: "rgba(245,158,11,0.12)", emoji: "🔧" },
  documentation:  { label: "Docs",            color: "#10b981", bg: "rgba(16,185,129,0.12)", emoji: "📚" },
  security:       { label: "Security",        color: "#ef4444", bg: "rgba(239,68,68,0.12)",  emoji: "🔒" },
  design:         { label: "Design",          color: "#ec4899", bg: "rgba(236,72,153,0.12)", emoji: "✨" },
  other:          { label: "Other",           color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", emoji: "⚡" },
};

export const STATUS_CONFIG: Record<BountyStatus, { label: string; color: string; bg: string }> = {
  open:        { label: "Open",        color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  in_progress: { label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  completed:   { label: "Completed",   color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  cancelled:   { label: "Cancelled",   color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

// DB helpers
export async function getBounties(filters?: { category?: BountyCategory; status?: BountyStatus }) {
  let q = supabase.from("bounties").select("*").order("created_at", { ascending: false });
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  const { data, error } = await q;
  if (error) throw error;
  return data as Bounty[];
}

export async function getBounty(id: string) {
  const { data, error } = await supabase
    .from("bounties").select("*, claims(*)").eq("id", id).single();
  if (error) throw error;
  return data as Bounty;
}

export async function createBounty(b: Omit<Bounty, "id" | "created_at" | "status" | "tx_hash" | "claims"> & { tx_hash?: string }) {
  const { data, error } = await supabase
    .from("bounties").insert({ ...b, status: "open" }).select().single();
  if (error) throw error;
  return data as Bounty;
}

export async function createClaim(c: Omit<Claim, "id" | "created_at" | "status" | "pay_tx_hash">) {
  const { data, error } = await supabase
    .from("claims").insert({ ...c, status: "pending" }).select().single();
  if (error) throw error;
  return data as Claim;
}

export async function acceptClaim(claimId: string, bountyId: string, payTxHash: string) {
  const [c, b] = await Promise.all([
    supabase.from("claims").update({ status: "accepted", pay_tx_hash: payTxHash }).eq("id", claimId),
    supabase.from("bounties").update({ status: "completed" }).eq("id", bountyId),
  ]);
  if (c.error) throw c.error;
  if (b.error) throw b.error;
}

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from("claims").select("claimer_wallet, claimer_name, bounty_id, bounties(reward_usdc)")
    .eq("status", "accepted");
  if (error) throw error;
  const map = new Map<string, { wallet: string; name: string; earned: number; count: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data || []).forEach((c: any) => {
    const existing = map.get(c.claimer_wallet) || { wallet: c.claimer_wallet, name: c.claimer_name, earned: 0, count: 0 };
    const bountyData = Array.isArray(c.bounties) ? c.bounties[0] : c.bounties;
    existing.earned += bountyData?.reward_usdc || 0;
    existing.count += 1;
    map.set(c.claimer_wallet, existing);
  });
  return Array.from(map.values()).sort((a, b) => b.earned - a.earned);
}
