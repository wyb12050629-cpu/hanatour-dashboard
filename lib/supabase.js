/**
 * lib/supabase.js
 * Supabase 클라이언트 + 클라우드 저장/불러오기 함수
 *
 * 테이블 구조 (Supabase SQL Editor에서 실행):
 *
 *   create table dashboard_data (
 *     key text primary key,
 *     value jsonb not null default '[]'::jsonb,
 *     updated_at timestamp with time zone default now()
 *   );
 *
 *   alter table dashboard_data enable row level security;
 *   create policy "Allow all" on dashboard_data
 *     for all using (true) with check (true);
 *
 * 환경변수:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 */

import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────
// 클라이언트 초기화
// ─────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** Supabase가 설정되어 있는지 여부 */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

/** Supabase 클라이언트 (설정되지 않으면 null) */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ─────────────────────────────────────────────
// 저장소 키 목록
// ─────────────────────────────────────────────

const DATA_KEYS = ['agencies', 'quotes', 'dailyLogs', 'incentives', 'departures'];

// ─────────────────────────────────────────────
// 클라우드 저장 / 불러오기
// ─────────────────────────────────────────────

/**
 * Supabase에서 전체 앱 상태를 불러옵니다.
 * @returns {Promise<Object|null>} 앱 상태 또는 null
 */
export async function loadFromCloud() {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('dashboard_data')
      .select('key, value')
      .in('key', DATA_KEYS);

    if (error) {
      console.error('[supabase] loadFromCloud 에러:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    const state = {
      agencies: [],
      quotes: [],
      dailyLogs: [],
      incentives: [],
      departures: [],
    };

    for (const row of data) {
      if (DATA_KEYS.includes(row.key)) {
        state[row.key] = row.value ?? [];
      }
    }

    // 데이터가 하나라도 있는지 확인
    const hasData = DATA_KEYS.some((k) => state[k]?.length > 0);
    return hasData ? state : null;
  } catch (err) {
    console.error('[supabase] loadFromCloud 실패:', err);
    return null;
  }
}

/**
 * Supabase에 전체 앱 상태를 저장합니다 (upsert).
 * @param {Object} state - 앱 전역 상태
 */
export async function saveToCloud(state) {
  if (!supabase) return;

  try {
    const rows = DATA_KEYS.map((key) => ({
      key,
      value: state[key] ?? [],
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('dashboard_data')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      console.error('[supabase] saveToCloud 에러:', error.message);
    }
  } catch (err) {
    console.error('[supabase] saveToCloud 실패:', err);
  }
}
