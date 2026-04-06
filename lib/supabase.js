/**
 * lib/supabase.js
 * Supabase 클라이언트 + 개별 테이블 CRUD 함수
 *
 * Supabase SQL Editor에서 아래 SQL 실행 필요:
 *
 *   -- 대리점
 *   create table agencies (
 *     code text primary key,
 *     data jsonb not null default '{}'::jsonb,
 *     updated_at timestamp with time zone default now()
 *   );
 *
 *   -- 견적
 *   create table quotes (
 *     quote_id text primary key,
 *     data jsonb not null default '{}'::jsonb,
 *     updated_at timestamp with time zone default now()
 *   );
 *
 *   -- 일일 로그
 *   create table daily_logs (
 *     id text primary key,
 *     data jsonb not null default '{}'::jsonb,
 *     updated_at timestamp with time zone default now()
 *   );
 *
 *   -- 인센티브
 *   create table incentives (
 *     quote_id text primary key,
 *     data jsonb not null default '{}'::jsonb,
 *     updated_at timestamp with time zone default now()
 *   );
 *
 *   -- RLS 정책 (모든 테이블에 적용)
 *   alter table agencies enable row level security;
 *   create policy "Allow all" on agencies for all using (true) with check (true);
 *   alter table quotes enable row level security;
 *   create policy "Allow all" on quotes for all using (true) with check (true);
 *   alter table daily_logs enable row level security;
 *   create policy "Allow all" on daily_logs for all using (true) with check (true);
 *   alter table incentives enable row level security;
 *   create policy "Allow all" on incentives for all using (true) with check (true);
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ─────────────────────────────────────────────
// 전체 데이터 로드
// ─────────────────────────────────────────────

export async function loadAllData() {
  if (!supabase) return null;
  try {
    const [ag, qu, dl, inc] = await Promise.all([
      supabase.from('agencies').select('*'),
      supabase.from('quotes').select('*'),
      supabase.from('daily_logs').select('*'),
      supabase.from('incentives').select('*'),
    ]);
    return {
      agencies:   (ag.data  || []).map((r) => r.data),
      quotes:     (qu.data  || []).map((r) => r.data),
      dailyLogs:  (dl.data  || []).map((r) => r.data),
      incentives: (inc.data || []).map((r) => r.data),
    };
  } catch (err) {
    console.error('[supabase] loadAllData 실패:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// 대리점 CRUD
// ─────────────────────────────────────────────

export async function upsertAgency(agency) {
  if (!supabase) return;
  await supabase.from('agencies').upsert({
    code: agency.대리점코드,
    data: agency,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'code' });
}

export async function deleteAgencyDB(code) {
  if (!supabase) return;
  await supabase.from('agencies').delete().eq('code', code);
}

// ─────────────────────────────────────────────
// 견적 CRUD
// ─────────────────────────────────────────────

export async function upsertQuote(quote) {
  if (!supabase) return;
  await supabase.from('quotes').upsert({
    quote_id: quote.견적번호,
    data: quote,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'quote_id' });
}

export async function deleteQuoteDB(quoteId) {
  if (!supabase) return;
  await supabase.from('quotes').delete().eq('quote_id', quoteId);
}

// ─────────────────────────────────────────────
// 일일 로그 CRUD
// ─────────────────────────────────────────────

export async function upsertDailyLog(log) {
  if (!supabase) return;
  const id = `${log.날짜}__${log.대리점코드}__${log.상품코드}`;
  await supabase.from('daily_logs').upsert({
    id,
    data: log,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
}

export async function deleteDailyLogDB(compositeKey) {
  if (!supabase) return;
  await supabase.from('daily_logs').delete().eq('id', compositeKey);
}

// ─────────────────────────────────────────────
// 인센티브 CRUD
// ─────────────────────────────────────────────

export async function upsertIncentive(incentive) {
  if (!supabase) return;
  await supabase.from('incentives').upsert({
    quote_id: incentive.온라인견적번호,
    data: incentive,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'quote_id' });
}

export async function deleteIncentiveDB(quoteId) {
  if (!supabase) return;
  await supabase.from('incentives').delete().eq('quote_id', quoteId);
}

// ─────────────────────────────────────────────
// 일괄 저장 (임포트 시 사용)
// ─────────────────────────────────────────────

export async function bulkSaveAll({ agencies, quotes, dailyLogs, incentives }) {
  if (!supabase) return;
  const now = new Date().toISOString();
  try {
    await Promise.all([
      agencies?.length > 0 && supabase.from('agencies').upsert(
        agencies.map((a) => ({ code: a.대리점코드, data: a, updated_at: now })),
        { onConflict: 'code' }
      ),
      quotes?.length > 0 && supabase.from('quotes').upsert(
        quotes.map((q) => ({ quote_id: q.견적번호, data: q, updated_at: now })),
        { onConflict: 'quote_id' }
      ),
      dailyLogs?.length > 0 && supabase.from('daily_logs').upsert(
        dailyLogs.map((l) => ({ id: `${l.날짜}__${l.대리점코드}__${l.상품코드}`, data: l, updated_at: now })),
        { onConflict: 'id' }
      ),
      incentives?.length > 0 && supabase.from('incentives').upsert(
        incentives.map((i) => ({ quote_id: i.온라인견적번호, data: i, updated_at: now })),
        { onConflict: 'quote_id' }
      ),
    ].filter(Boolean));
  } catch (err) {
    console.error('[supabase] bulkSaveAll 실패:', err);
  }
}

// ─────────────────────────────────────────────
// 전체 삭제 (초기화 시 사용)
// ─────────────────────────────────────────────

export async function clearAllData() {
  if (!supabase) return;
  try {
    await Promise.all([
      supabase.from('agencies').delete().neq('code', ''),
      supabase.from('quotes').delete().neq('quote_id', ''),
      supabase.from('daily_logs').delete().neq('id', ''),
      supabase.from('incentives').delete().neq('quote_id', ''),
    ]);
  } catch (err) {
    console.error('[supabase] clearAllData 실패:', err);
  }
}
