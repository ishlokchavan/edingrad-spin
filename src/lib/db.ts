import { createClient, type SupabaseClient } from '@supabase/supabase-js'
let _c: SupabaseClient | null = null
export const getDb = () => {
  if (!_c) _c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _c
}

export const fmt = (n: number | null | undefined) =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n ?? 0)

/** Weighted random pick */
export function weightedPick<T extends { id: string; weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) { r -= item.weight; if (r <= 0) return item }
  return items[items.length - 1]
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
