/**
 * lib/supabase.js
 * [DEMO] localStorage 기반 CRUD — Supabase 제거 버전
 *
 * 모든 데이터를 브라우저 localStorage에 저장합니다.
 * API 시그니처는 기존과 동일하게 유지하여 다른 컴포넌트 수정을 최소화합니다.
 */

const STORAGE_KEYS = {
  agencies:   'demo_agencies',
  quotes:     'demo_quotes',
  dailyLogs:  'demo_dailyLogs',
  incentives: 'demo_incentives',
};

// ─────────────────────────────────────────────
// 내부 유틸
// ─────────────────────────────────────────────

function getStore(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function setStore(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('[localStorage] 저장 실패:', e);
  }
}

/** 배열에서 keyFn 기준 중복 제거 (마지막 것 유지) */
function dedup(arr, keyFn) {
  const map = {};
  for (const item of arr) {
    const k = keyFn(item);
    if (k) map[k] = item;
  }
  return Object.values(map);
}

// ═════════════════════════════════════════════
// 전체 데이터 로드
// ═════════════════════════════════════════════

export async function loadAllData() {
  try {
    return {
      agencies:   getStore(STORAGE_KEYS.agencies),
      quotes:     getStore(STORAGE_KEYS.quotes),
      dailyLogs:  getStore(STORAGE_KEYS.dailyLogs),
      incentives: getStore(STORAGE_KEYS.incentives),
    };
  } catch (err) {
    console.error('[localStorage] loadAllData 실패:', err);
    return null;
  }
}

// ═════════════════════════════════════════════
// 대리점 CRUD
// ═════════════════════════════════════════════

export async function upsertAgency(agency) {
  const list = getStore(STORAGE_KEYS.agencies);
  const idx = list.findIndex((a) => a.대리점코드 === agency.대리점코드);
  if (idx >= 0) list[idx] = { ...list[idx], ...agency };
  else list.push(agency);
  setStore(STORAGE_KEYS.agencies, list);
}

export async function deleteAgencyDB(code) {
  const list = getStore(STORAGE_KEYS.agencies).filter((a) => a.대리점코드 !== code);
  setStore(STORAGE_KEYS.agencies, list);
}

// ═════════════════════════════════════════════
// 견적 CRUD
// ═════════════════════════════════════════════

export async function upsertQuote(quote) {
  const list = getStore(STORAGE_KEYS.quotes);
  const idx = list.findIndex((q) => q.견적번호 === quote.견적번호);
  if (idx >= 0) list[idx] = { ...list[idx], ...quote };
  else list.push(quote);
  setStore(STORAGE_KEYS.quotes, list);
}

export async function deleteQuoteDB(quoteId) {
  const list = getStore(STORAGE_KEYS.quotes).filter((q) => q.견적번호 !== quoteId);
  setStore(STORAGE_KEYS.quotes, list);
}

// ═════════════════════════════════════════════
// 일일 로그 CRUD
// ═════════════════════════════════════════════

export async function upsertDailyLog(log) {
  const list = getStore(STORAGE_KEYS.dailyLogs);
  const key = `${log.날짜}__${log.대리점코드}__${log.상품코드}`;
  const idx = list.findIndex((l) => `${l.날짜}__${l.대리점코드}__${l.상품코드}` === key);
  if (idx >= 0) list[idx] = { ...list[idx], ...log };
  else list.push(log);
  setStore(STORAGE_KEYS.dailyLogs, list);
}

export async function deleteDailyLogDB(compositeKey) {
  const list = getStore(STORAGE_KEYS.dailyLogs).filter(
    (l) => `${l.날짜}__${l.대리점코드}__${l.상품코드}` !== compositeKey,
  );
  setStore(STORAGE_KEYS.dailyLogs, list);
}

// ═════════════════════════════════════════════
// 인센티브 CRUD
// ═════════════════════════════════════════════

export async function upsertIncentive(incentive) {
  const list = getStore(STORAGE_KEYS.incentives);
  const idx = list.findIndex((i) => i.온라인견적번호 === incentive.온라인견적번호);
  if (idx >= 0) list[idx] = { ...list[idx], ...incentive };
  else list.push(incentive);
  setStore(STORAGE_KEYS.incentives, list);
}

export async function deleteIncentiveDB(quoteId) {
  const list = getStore(STORAGE_KEYS.incentives).filter((i) => i.온라인견적번호 !== quoteId);
  setStore(STORAGE_KEYS.incentives, list);
}

// ═════════════════════════════════════════════
// 일괄 저장 (임포트 시)
// ═════════════════════════════════════════════

export async function bulkSaveAll({ agencies, quotes, dailyLogs, incentives }) {
  if (agencies?.length) {
    const unique = dedup(agencies, (a) => a.대리점코드);
    setStore(STORAGE_KEYS.agencies, unique);
  }
  if (quotes?.length) {
    const unique = dedup(quotes, (q) => q.견적번호);
    setStore(STORAGE_KEYS.quotes, unique);
  }
  if (dailyLogs?.length) {
    const unique = dedup(dailyLogs, (l) => `${l.날짜}__${l.대리점코드}__${l.상품코드}`);
    setStore(STORAGE_KEYS.dailyLogs, unique);
  }
  if (incentives?.length) {
    const unique = dedup(incentives, (i) => i.온라인견적번호);
    setStore(STORAGE_KEYS.incentives, unique);
  }
}

// ═════════════════════════════════════════════
// 전체 삭제 (초기화 시)
// ═════════════════════════════════════════════

export async function clearAllData() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    if (typeof window !== 'undefined') localStorage.removeItem(key);
  });
}
