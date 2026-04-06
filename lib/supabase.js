/**
 * lib/supabase.js
 * Supabase 개별 컬럼 CRUD — 한국어 필드명 ↔ 영어 컬럼명 매핑
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ═════════════════════════════════════════════
// 필드 매핑: 앱(한국어) → DB(영어)
// ═════════════════════════════════════════════

function agencyToRow(a) {
  return {
    code: a.대리점코드 || '',
    name: a.대리점명 || '',
    type: a.대리점유형 || '',
    shape: a.점형태 || '',
    internal_grade: a.내부등급 || '',
    team: a.팀 || '',
    department: a.부서 || '',
    manager: a.담당자 || '',
    report_type: a.보고구분 || '',
    grade: a.관리등급 || '',
    feature: a.특징 || '',
    next_action: a.다음액션 || '',
    last_contact: a.최근접촉일 || '',
    memo: a.메모 || '',
  };
}

function rowToAgency(r) {
  return {
    대리점코드: r.code || '',
    대리점명: r.name || '',
    대리점유형: r.type || '',
    점형태: r.shape || '',
    내부등급: r.internal_grade || '',
    팀: r.team || '',
    부서: r.department || '',
    담당자: r.manager || '',
    보고구분: r.report_type || '',
    관리등급: r.grade || '',
    특징: r.feature || '',
    다음액션: r.next_action || '',
    최근접촉일: r.last_contact || '',
    메모: r.memo || '',
  };
}

function quoteToRow(q) {
  return {
    quote_id: q.견적번호 || '',
    agency_code: q.대리점코드 || '',
    agency_name: q.대리점명 || '',
    report_type: q.보고구분 || '',
    register_date: q.등록일 || '',
    depart_date: q.출발일 || '',
    pax: q.인원 || 0,
    price: q.가격 || 0,
    product_code: q.상품코드 || '',
    status: q.상태 || '',
    next_todo: q.다음할일 || '',
    memo: q.메모 || '',
  };
}

function rowToQuote(r) {
  return {
    견적번호: r.quote_id || '',
    대리점코드: r.agency_code || '',
    대리점명: r.agency_name || '',
    보고구분: r.report_type || '',
    등록일: r.register_date || '',
    출발일: r.depart_date || '',
    인원: r.pax || 0,
    가격: r.price || 0,
    상품코드: r.product_code || '',
    상태: r.status || '',
    다음할일: r.next_todo || '',
    메모: r.memo || '',
  };
}

function logToRow(l) {
  return {
    id: `${l.날짜}__${l.대리점코드}__${l.상품코드}`,
    date: l.날짜 || '',
    week_wednesday: l.주차 || '',
    agency_code: l.대리점코드 || '',
    agency_name: l.대리점명 || '',
    report_type: l.보고구분 || '',
    work_type: l.업무구분 || '',
    product_code: l.상품코드 || '',
    is_inbound: l.견적인입여부 ?? 0,
    is_confirmed: l.체결여부 ?? 0,
    pax: l.인원 || 0,
    revenue: l.매출 || 0,
    content: l.내용 || '',
    next_action: l.다음액션 || '',
    status: l.상태 || '',
  };
}

function rowToLog(r) {
  return {
    날짜: r.date || '',
    주차: r.week_wednesday || '',
    대리점코드: r.agency_code || '',
    대리점명: r.agency_name || '',
    보고구분: r.report_type || '',
    업무구분: r.work_type || '',
    상품코드: r.product_code || '',
    견적인입여부: r.is_inbound ?? 0,
    체결여부: r.is_confirmed ?? 0,
    인원: r.pax || 0,
    매출: r.revenue || 0,
    내용: r.content || '',
    다음액션: r.next_action || '',
    상태: r.status || '',
  };
}

function incentiveToRow(i) {
  return {
    quote_id: i.온라인견적번호 || '',
    agency_name: i.대리점명 || '',
    keyman: i.키맨 || '',
    product_manager: i.상품담당자 || '',
    product_code: i.상품코드 || '',
    region: i.지역 || '',
    online_quote_no: i.온라인견적번호 || '',
    depart_date: i.출발일 || '',
    pax: i.인원수 || 0,
    first_price: i.최초입금가 || 0,
    final_price: i.최종입금가 || 0,
    final_net: i.최종넷가 || 0,
    total_revenue: i.총매출액 || 0,
    hana_profit: i.하나투어수익 || 0,
    has_presale: i.선발권여부 || '',
    has_ticket: i.발권여부 || '',
    is_confirmed: i.체결여부 || '',
    team_color: i.팀컬러 || '',
    land_fee: i.지상비 || 0,
    land_note: i.지상특이사항 || '',
    hotel_name: i.호텔명 || '',
    hotel_note: i.호텔특이사항 || '',
    has_option: i.추가옵션여부 || '',
    option_content: i.추가옵션내용 || '',
    guide_type: i.가이드형태 || '',
    has_deposit: i.계약금납입여부 || '',
    is_paid: i.입금완료 || '',
    price_changed: i.입금가변동 || '',
    special_note: i.특이사항 || '',
    updated_date: i.업데이트일 || '',
    air_agency: i.항공_대리점 ?? 0,
    air_hana: i.항공_하나투어 ?? 0,
    land_agency: i.지상_대리점 ?? 0,
    land_hana: i.지상_하나투어 ?? 0,
    common_agency: i.공동경비_대리점 ?? 0,
    common_hana: i.공동경비_하나투어 ?? 0,
    net_agency: i.넷가_대리점 ?? 0,
    net_hana: i.넷가_하나투어 ?? 0,
    profit_agency: i.수익_대리점 ?? 0,
    profit_hana: i.수익_하나투어 ?? 0,
    payment_agency: i.입금가_대리점 ?? 0,
    payment_hana: i.입금가_하나투어 ?? 0,
  };
}

function rowToIncentive(r) {
  return {
    대리점명: r.agency_name || '',
    키맨: r.keyman || '',
    상품담당자: r.product_manager || '',
    상품코드: r.product_code || '',
    지역: r.region || '',
    온라인견적번호: r.online_quote_no || r.quote_id || '',
    출발일: r.depart_date || '',
    인원수: r.pax || 0,
    최초입금가: r.first_price || 0,
    최종입금가: r.final_price || 0,
    최종넷가: r.final_net || 0,
    총매출액: r.total_revenue || 0,
    하나투어수익: r.hana_profit || 0,
    선발권여부: r.has_presale || '',
    발권여부: r.has_ticket || '',
    체결여부: r.is_confirmed || '',
    팀컬러: r.team_color || '',
    지상비: r.land_fee || 0,
    지상특이사항: r.land_note || '',
    호텔명: r.hotel_name || '',
    호텔특이사항: r.hotel_note || '',
    추가옵션여부: r.has_option || '',
    추가옵션내용: r.option_content || '',
    가이드형태: r.guide_type || '',
    계약금납입여부: r.has_deposit || '',
    입금완료: r.is_paid || '',
    입금가변동: r.price_changed || '',
    특이사항: r.special_note || '',
    업데이트일: r.updated_date || '',
    항공_대리점: r.air_agency ?? 0,
    항공_하나투어: r.air_hana ?? 0,
    지상_대리점: r.land_agency ?? 0,
    지상_하나투어: r.land_hana ?? 0,
    공동경비_대리점: r.common_agency ?? 0,
    공동경비_하나투어: r.common_hana ?? 0,
    넷가_대리점: r.net_agency ?? 0,
    넷가_하나투어: r.net_hana ?? 0,
    수익_대리점: r.profit_agency ?? 0,
    수익_하나투어: r.profit_hana ?? 0,
    입금가_대리점: r.payment_agency ?? 0,
    입금가_하나투어: r.payment_hana ?? 0,
  };
}

// ═════════════════════════════════════════════
// 전체 데이터 로드
// ═════════════════════════════════════════════

export async function loadAllData() {
  if (!supabase) {
    console.warn('[supabase] 클라이언트 미설정');
    return null;
  }
  try {
    const [ag, qu, dl, inc] = await Promise.all([
      supabase.from('agencies').select('*'),
      supabase.from('quotes').select('*'),
      supabase.from('daily_logs').select('*'),
      supabase.from('incentives').select('*'),
    ]);
    if (ag.error) console.error('[supabase] agencies:', ag.error.message);
    if (qu.error) console.error('[supabase] quotes:', qu.error.message);
    if (dl.error) console.error('[supabase] daily_logs:', dl.error.message);
    if (inc.error) console.error('[supabase] incentives:', inc.error.message);

    return {
      agencies:   (ag.data  || []).map(rowToAgency),
      quotes:     (qu.data  || []).map(rowToQuote),
      dailyLogs:  (dl.data  || []).map(rowToLog),
      incentives: (inc.data || []).map(rowToIncentive),
    };
  } catch (err) {
    console.error('[supabase] loadAllData 실패:', err);
    return null;
  }
}

// ═════════════════════════════════════════════
// 대리점 CRUD
// ═════════════════════════════════════════════

export async function upsertAgency(agency) {
  if (!supabase) return;
  const { error } = await supabase.from('agencies')
    .upsert(agencyToRow(agency), { onConflict: 'code' });
  if (error) console.error('agencies upsert:', error);
}

export async function deleteAgencyDB(code) {
  if (!supabase) return;
  const { error } = await supabase.from('agencies').delete().eq('code', code);
  if (error) console.error('agencies delete:', error);
}

// ═════════════════════════════════════════════
// 견적 CRUD
// ═════════════════════════════════════════════

export async function upsertQuote(quote) {
  if (!supabase) return;
  const { error } = await supabase.from('quotes')
    .upsert(quoteToRow(quote), { onConflict: 'quote_id' });
  if (error) console.error('quotes upsert:', error);
}

export async function deleteQuoteDB(quoteId) {
  if (!supabase) return;
  const { error } = await supabase.from('quotes').delete().eq('quote_id', quoteId);
  if (error) console.error('quotes delete:', error);
}

// ═════════════════════════════════════════════
// 일일 로그 CRUD
// ═════════════════════════════════════════════

export async function upsertDailyLog(log) {
  if (!supabase) return;
  const { error } = await supabase.from('daily_logs')
    .upsert(logToRow(log), { onConflict: 'id' });
  if (error) console.error('daily_logs upsert:', error);
}

export async function deleteDailyLogDB(compositeKey) {
  if (!supabase) return;
  const { error } = await supabase.from('daily_logs').delete().eq('id', compositeKey);
  if (error) console.error('daily_logs delete:', error);
}

// ═════════════════════════════════════════════
// 인센티브 CRUD
// ═════════════════════════════════════════════

export async function upsertIncentive(incentive) {
  if (!supabase) return;
  const { error } = await supabase.from('incentives')
    .upsert(incentiveToRow(incentive), { onConflict: 'quote_id' });
  if (error) console.error('incentives upsert:', error);
}

export async function deleteIncentiveDB(quoteId) {
  if (!supabase) return;
  const { error } = await supabase.from('incentives').delete().eq('quote_id', quoteId);
  if (error) console.error('incentives delete:', error);
}

// ═════════════════════════════════════════════
// 일괄 저장 (임포트 시)
// ═════════════════════════════════════════════

/** 배열에서 keyFn 기준 중복 제거 (마지막 것 유지) */
function dedup(arr, keyFn) {
  const map = {};
  for (const item of arr) {
    const k = keyFn(item);
    if (k) map[k] = item;
  }
  return Object.values(map);
}

export async function bulkSaveAll({ agencies, quotes, dailyLogs, incentives }) {
  if (!supabase) return;
  try {
    const promises = [];
    if (agencies?.length) {
      const unique = dedup(agencies, (a) => a.대리점코드);
      promises.push(supabase.from('agencies').upsert(unique.map(agencyToRow), { onConflict: 'code' }));
    }
    if (quotes?.length) {
      const unique = dedup(quotes, (q) => q.견적번호);
      promises.push(supabase.from('quotes').upsert(unique.map(quoteToRow), { onConflict: 'quote_id' }));
    }
    if (dailyLogs?.length) {
      const unique = dedup(dailyLogs, (l) => `${l.날짜}__${l.대리점코드}__${l.상품코드}`);
      promises.push(supabase.from('daily_logs').upsert(unique.map(logToRow), { onConflict: 'id' }));
    }
    if (incentives?.length) {
      const unique = dedup(incentives, (i) => i.온라인견적번호);
      promises.push(supabase.from('incentives').upsert(unique.map(incentiveToRow), { onConflict: 'quote_id' }));
    }
    const results = await Promise.all(promises);
    results.forEach((r) => { if (r.error) console.error('[supabase] bulkSave:', r.error.message); });
  } catch (err) {
    console.error('[supabase] bulkSaveAll:', err);
  }
}

// ═════════════════════════════════════════════
// 전체 삭제 (초기화 시)
// ═════════════════════════════════════════════

export async function clearAllData() {
  if (!supabase) return;
  await Promise.all([
    supabase.from('agencies').delete().neq('code', ''),
    supabase.from('quotes').delete().neq('quote_id', ''),
    supabase.from('daily_logs').delete().neq('id', ''),
    supabase.from('incentives').delete().neq('quote_id', ''),
  ]);
}
