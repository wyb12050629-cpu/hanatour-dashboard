/**
 * lib/supabase.js
 * Supabase 클라이언트 + 개별 테이블 CRUD 함수
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ─────────────────────────────────────────────
// 전체 데이터 로드
// ─────────────────────────────────────────────

export async function loadAllData() {
  if (!supabase) {
    console.warn('[supabase] 클라이언트 미설정 — 환경변수 확인 필요');
    return null;
  }
  try {
    const [ag, qu, dl, inc] = await Promise.all([
      supabase.from('agencies').select('*'),
      supabase.from('quotes').select('*'),
      supabase.from('daily_logs').select('*'),
      supabase.from('incentives').select('*'),
    ]);

    // 에러 체크
    if (ag.error) console.error('[supabase] agencies 로드 에러:', ag.error.message);
    if (qu.error) console.error('[supabase] quotes 로드 에러:', qu.error.message);
    if (dl.error) console.error('[supabase] daily_logs 로드 에러:', dl.error.message);
    if (inc.error) console.error('[supabase] incentives 로드 에러:', inc.error.message);

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
  const { error } = await supabase.from('agencies').upsert({
    code: agency.대리점코드,
    data: agency,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'code' });
  if (error) console.error('[supabase] upsertAgency:', error.message);
}

export async function deleteAgencyDB(code) {
  if (!supabase) return;
  const { error } = await supabase.from('agencies').delete().eq('code', code);
  if (error) console.error('[supabase] deleteAgency:', error.message);
}

// ─────────────────────────────────────────────
// 견적 CRUD
// ─────────────────────────────────────────────

export async function upsertQuote(quote) {
  if (!supabase) return;
  const { error } = await supabase.from('quotes').upsert({
    quote_id: quote.견적번호,
    data: quote,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'quote_id' });
  if (error) console.error('[supabase] upsertQuote:', error.message);
}

export async function deleteQuoteDB(quoteId) {
  if (!supabase) return;
  const { error } = await supabase.from('quotes').delete().eq('quote_id', quoteId);
  if (error) console.error('[supabase] deleteQuote:', error.message);
}

// ─────────────────────────────────────────────
// 일일 로그 CRUD
// ─────────────────────────────────────────────

export async function upsertDailyLog(log) {
  if (!supabase) return;
  const id = `${log.날짜}__${log.대리점코드}__${log.상품코드}`;
  const { error } = await supabase.from('daily_logs').upsert({
    id,
    data: log,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) console.error('[supabase] upsertDailyLog:', error.message);
}

export async function deleteDailyLogDB(compositeKey) {
  if (!supabase) return;
  const { error } = await supabase.from('daily_logs').delete().eq('id', compositeKey);
  if (error) console.error('[supabase] deleteDailyLog:', error.message);
}

// ─────────────────────────────────────────────
// 인센티브 CRUD
// ─────────────────────────────────────────────

export async function upsertIncentive(incentive) {
  if (!supabase) return;
  const { error } = await supabase.from('incentives').upsert({
    quote_id: incentive.온라인견적번호,
    data: incentive,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'quote_id' });
  if (error) console.error('[supabase] upsertIncentive:', error.message);
}

export async function deleteIncentiveDB(quoteId) {
  if (!supabase) return;
  const { error } = await supabase.from('incentives').delete().eq('quote_id', quoteId);
  if (error) console.error('[supabase] deleteIncentive:', error.message);
}

// ─────────────────────────────────────────────
// 일괄 저장 (임포트 시 사용)
// ─────────────────────────────────────────────

export async function bulkSaveAll({ agencies, quotes, dailyLogs, incentives }) {
  if (!supabase) return;
  const now = new Date().toISOString();
  try {
    const promises = [];
    if (agencies?.length > 0) {
      promises.push(supabase.from('agencies').upsert(
        agencies.map((a) => ({ code: a.대리점코드, data: a, updated_at: now })),
        { onConflict: 'code' }
      ));
    }
    if (quotes?.length > 0) {
      promises.push(supabase.from('quotes').upsert(
        quotes.map((q) => ({ quote_id: q.견적번호, data: q, updated_at: now })),
        { onConflict: 'quote_id' }
      ));
    }
    if (dailyLogs?.length > 0) {
      promises.push(supabase.from('daily_logs').upsert(
        dailyLogs.map((l) => ({ id: `${l.날짜}__${l.대리점코드}__${l.상품코드}`, data: l, updated_at: now })),
        { onConflict: 'id' }
      ));
    }
    if (incentives?.length > 0) {
      promises.push(supabase.from('incentives').upsert(
        incentives.map((i) => ({ quote_id: i.온라인견적번호, data: i, updated_at: now })),
        { onConflict: 'quote_id' }
      ));
    }
    const results = await Promise.all(promises);
    results.forEach((r) => { if (r.error) console.error('[supabase] bulkSave:', r.error.message); });
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
