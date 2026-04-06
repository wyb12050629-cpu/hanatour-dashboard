/**
 * lib/store.js
 * 하나투어 영업/인센티브 통합 대시보드 — 전체 데이터 허브
 *
 * 소스 파일:
 *   - 대리점관리_HI327.xlsx  (Agency_Overview · 견적정리 · Daily_Log)
 *   - 2026_인센티브_관리.xlsx (인센정리 · 출발일관리 · 2분기 · 3분기 · 4분기)
 */

import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

// ─────────────────────────────────────────────
// 초기(빈) 상태 스냅샷
// ─────────────────────────────────────────────

/**
 * 앱 전역 상태의 초기값.
 * useState / useReducer 초기화 또는 리셋 시 사용합니다.
 * @type {{
 *   agencies: Array<Object>,
 *   quotes: Array<Object>,
 *   dailyLogs: Array<Object>,
 *   incentives: Array<Object>,
 *   departures: Array<Object>,
 *   quarterlyDetails: Object
 * }}
 */
export const EMPTY_STATE = {
  agencies: [],
  quotes: [],
  dailyLogs: [],
  incentives: [],
  departures: [],
  quarterlyDetails: {},
};

// ─────────────────────────────────────────────
// 1. 데이터 영속성 → lib/supabase.js 로 이전됨
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// 2. 주차 범위 계산
// ─────────────────────────────────────────────

/**
 * 현재 주차의 **수요일 00:00 ~ 다음 주 화요일 23:59:59** 범위를 반환합니다.
 *
 * Daily_Log 시트의 '주차(수요일)' 컬럼과 동일한 기준을 사용합니다.
 * - day() 기준: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
 * - 수요일 이후(목~토)라면 이번 주 수요일을 기준으로 삼음
 * - 수요일 이전(일~화)이라면 지난 주 수요일을 기준으로 삼음
 *
 * @returns {{ start: import('dayjs').Dayjs, end: import('dayjs').Dayjs }}
 *   start: 이번 주차 수요일 자정 / end: 다음 주 화요일 23:59:59
 */
export function getCurrentWeekRange() {
  const today = dayjs();
  const dow = today.day(); // 0(일) ~ 6(토)

  // 이번 주차 수요일(day=3) 계산
  //   dow >= 3 → 이번 주 수요일: today - (dow - 3)
  //   dow  < 3 → 지난 주 수요일: today - (dow + 4)
  const diffToWed = dow >= 3 ? dow - 3 : dow + 4;
  const wednesday = today.subtract(diffToWed, 'day').startOf('day');

  return {
    start: wednesday,
    end: wednesday.add(6, 'day').endOf('day'), // 화요일 23:59:59
  };
}

/**
 * 해당 연도의 모든 수요일~화요일 주차 옵션을 생성합니다.
 *
 * @param {number} year - 연도 (예: 2026)
 * @returns {Array<{ label: string, value: string, start: import('dayjs').Dayjs, end: import('dayjs').Dayjs }>}
 *   label: "4월 2주차 (4/1~4/7)"
 *   value: 수요일 날짜 문자열 'YYYY-MM-DD' (선택 키)
 *   start/end: dayjs 객체
 */
export function generateWeekOptions(year) {
  const options = [];
  // 해당 연도 1월 1일이 속한 주차의 수요일부터 시작
  let d = dayjs(`${year}-01-01`);
  const dow = d.day();
  const diffToWed = dow >= 3 ? dow - 3 : dow + 4;
  let wed = d.subtract(diffToWed, 'day').startOf('day');

  // 월별 카운터 (시작일 기준 월로 N주차 계산)
  const monthCount = {};

  const endOfYear = dayjs(`${year}-12-31`).endOf('day');

  while (wed.isBefore(endOfYear) || wed.isSame(endOfYear, 'day')) {
    const start = wed;
    const end = wed.add(6, 'day');
    const month = start.month() + 1; // 1~12

    if (!monthCount[month]) monthCount[month] = 0;
    monthCount[month] += 1;

    const label = `${month}월 ${monthCount[month]}주차 (${start.format('M/D')}~${end.format('M/D')})`;

    options.push({
      label,
      value: start.format('YYYY-MM-DD'),
      start,
      end: end.endOf('day'),
    });

    wed = wed.add(7, 'day');
  }

  return options;
}

/**
 * 분기 번호(1~4)에 해당하는 날짜 범위를 반환합니다.
 *
 * @param {number} quarter - 1 | 2 | 3 | 4
 * @param {number} [year] - 연도 (기본: 올해)
 * @returns {{ start: string, end: string }} 'YYYY-MM-DD' 형식
 */
export function getQuarterRange(quarter, year = dayjs().year()) {
  const ranges = {
    1: { start: `${year}-01-01`, end: `${year}-03-31` },
    2: { start: `${year}-04-01`, end: `${year}-06-30` },
    3: { start: `${year}-07-01`, end: `${year}-09-30` },
    4: { start: `${year}-10-01`, end: `${year}-12-31` },
  };
  return ranges[quarter] ?? null;
}

// ─────────────────────────────────────────────
// 내부 유틸
// ─────────────────────────────────────────────

/**
 * 엑셀 시리얼 날짜(숫자) 또는 여러 형식의 날짜 값을 'YYYY-MM-DD' 문자열로 변환합니다.
 *
 * Excel은 1900-01-01 = 1로 시작하며 1900년 윤년 버그(+1)를 포함하므로
 * Unix epoch 변환 시 25569를 빼서 보정합니다.
 *
 * @param {number | string | Date | null | undefined} value
 * @returns {string} 'YYYY-MM-DD' 또는 변환 불가 시 ''
 */
function toDateStr(value) {
  if (value === null || value === undefined || value === '') return '';

  // Date 객체
  if (value instanceof Date) {
    const d = dayjs(value);
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }

  // 이미 날짜 문자열 (ISO / 한국식)
  if (typeof value === 'string') {
    const d = dayjs(value.trim());
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }

  // Excel 시리얼 숫자 → UTC ��리초 → Date → dayjs
  // new Date(ms)로 UTC 기준 생성 후 로컬 포맷 (KST에서 날짜 밀림 방지)
  if (typeof value === 'number' && value > 0) {
    const ms = (value - 25569) * 86400 * 1000;
    const d = dayjs(new Date(ms));
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }

  return '';
}

/**
 * XLSX 워크시트를 객체 배열로 변환합니다. (1행: 헤더, defval: '')
 *
 * @param {Object} ws - XLSX 워크시트
 * @returns {Array<Object>}
 */
function wsToRows(ws) {
  return XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
}

/**
 * 값을 안전하게 문자열로 변환합니다.
 * @param {*} v
 * @returns {string}
 */
const str = (v) => String(v ?? '').trim();

/**
 * 값을 안전하게 숫자로 변환합니다.
 * @param {*} v
 * @returns {number}
 */
const num = (v) => Number(v) || 0;

// ─────────────────────────────────────────────
// 3. 엑셀 파일 파싱
// ─────────────────────────────────────────────

/**
 * 업로드된 엑셀 파일 하나를 파싱합니다.
 *
 * 포함된 시트명을 자동 감지하여 대응하는 데이터를 추출합니다:
 * - **대리점관리_HI327.xlsx**: Agency_Overview · 견적정리 · Daily_Log
 * - **2026_인센티브_관리.xlsx**: 인센정리 · 출발일관리 · 2분기 · 3분기 · 4분기
 *
 * @param {File} file - `<input type="file">` 또는 드래그앤드롭으로 전달된 File 객체
 * @returns {Promise<{
 *   agencies: Array<Object>,
 *   quotes: Array<Object>,
 *   dailyLogs: Array<Object>,
 *   incentives: Array<Object>,
 *   departures: Array<Object>,
 *   quarterlyDetails: Object
 * }>}
 */
export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', raw: true, cellDates: false });

  const out = { ...EMPTY_STATE, quarterlyDetails: {} };

  // ── Agency_Overview ──────────────────────────────
  const wsAgency = wb.Sheets['Agency_Overview'];
  if (wsAgency) {
    out.agencies = wsToRows(wsAgency)
      .map((r) => ({
        대리점코드:   str(r['대리점코드']),
        대리점명:     str(r['대리점명']),
        대리점유형:   str(r['대리점유형']),
        점형태:       str(r['점형태']),
        내부등급:     str(r['내부등급']),
        팀:           str(r['팀']),
        부서:         str(r['부서']),
        담당자:       str(r['담당자']),
        보고구분:     str(r['보고구분']),   // '공식인증' | '일반대리점'
        관리등급:     str(r['관리등급']),   // 'A' | 'B' | 'C'
        특징:         str(r['특징']),
        다음액션:     str(r['다음액션']),
        최근접촉일:   toDateStr(r['최근접촉일']),
        메모:         str(r['메모']),
      }))
      .filter((r) => r.대리점코드);
  }

  // ── 견적정리 ─────────────────────────────────────
  const wsQuote = wb.Sheets['견적정리'];
  if (wsQuote) {
    out.quotes = wsToRows(wsQuote)
      .map((r) => ({
        등록일:   toDateStr(r['등록일']),
        견적번호:  str(r['견적번호']),           // PK
        대리점코드: str(r['대리점코드']),          // 자동 입력
        대리점명:   str(r['대리점명']),
        보고구분:   str(r['보고구분']),
        인원:      num(r['인원']),
        출발일:    toDateStr(r['출발일']),
        가격:      num(r['가격']),
        상품코드:   str(r['상품코드']),
        상태:      str(r['상태']),               // '체결' | '협의중' | '미체결'
        다음할일:  str(r['다음할일']),
        메모:      str(r['메모']),
      }))
      .filter((r) => r.견적번호);
  }

  // ── Daily_Log ────────────────────────────────────
  const wsDaily = wb.Sheets['Daily_Log'];
  if (wsDaily) {
    out.dailyLogs = wsToRows(wsDaily)
      .map((r) => ({
        날짜:       toDateStr(r['날짜']),
        주차:       toDateStr(r['주차(수요일)']),
        대리점코드:  str(r['대리점코드']),
        대리점명:    str(r['대리점명']),
        보고구분:    str(r['보고구분']),
        업무구분:    str(r['업무구분']),           // '견적' | '예약' | 기타
        상품코드:    str(r['상품코드']),
        견적인입여부: num(r['견적인입여부']),       // 0 | 1
        체결여부:    num(r['체결여부']),            // 0 | 1
        인원:       num(r['인원']),
        매출:       num(r['매출']),
        내용:       str(r['내용']),
        다음액션:    str(r['다음액션']),
        상태:       str(r['상태']),
      }))
      .filter((r) => r.날짜 || r.대리점코드);
  }

  // ── 인센정리 ─────────────────────────────────────
  const wsIncent = wb.Sheets['인센정리'];
  if (wsIncent) {
    out.incentives = wsToRows(wsIncent)
      .map((r) => ({
        대리점명:       str(r['대리점명']),
        키맨:           str(r['키맨']),
        상품담당자:      str(r['상품담당자']),
        상품코드:        str(r['상품코드']),            // FK → Daily_Log
        지역:           str(r['지역']),
        온라인견적번호:   str(r['온라인견적번호']),       // FK → 견적정리.견적번호
        출발일:         toDateStr(r['출발일']),
        인원수:         num(r['인원수']),
        최초입금가:      num(r['최초입금가']),
        최종입금가:      num(r['최종입금가']),
        최종넷가:        num(r['최종넷가']),
        총매출액:        num(r['총매출액']),
        하나투어수익:     num(r['하나투어 수익']),
        선발권여부:      str(r['선발권여부']),           // 'O' | 'X'
        발권여부:        str(r['발권여부']),
        체결여부:        str(r['체결여부']),             // '체결' | '미체결'
        팀컬러:         str(r['팀컬러']),
        지상비:         num(r['지상비']),
        지상특이사항:    str(r['지상특이사항']),
        호텔명:         str(r['호텔명']),
        호텔특이사항:    str(r['호텔특이사항']),
        추가옵션여부:    str(r['추가옵션여부']),
        추가옵션내용:    str(r['추가옵션내용']),
        가이드형태:      str(r['가이드형태']),
        계약금납입여부:   str(r['계약금납입여부']),
        입금완료:        str(r['입금완료']),
        입금가변동:      str(r['입금가변동']),
        특이사항:        str(r['특이사항/미체결사유']),
        업데이트일:      toDateStr(r['업데이트일']),
      }))
      .filter((r) => r.대리점명 || r.온라인견적번호);
  }

  // ── 출발일관리 ───────────────────────────────────
  const wsDep = wb.Sheets['출발일관리'];
  if (wsDep) {
    out.departures = wsToRows(wsDep)
      .map((r) => ({
        대리점명:  str(r['대리점명']),
        상품코드:  str(r['상품코드']),
        인원:     num(r['인원']),
        출발일:   toDateStr(r['출발일']),
        dday:     num(r['D-day']),
      }))
      .filter((r) => r.대리점명 || r.상품코드);
  }

  // ── 2분기 / 3분기 / 4분기 ────────────────────────
  for (const quarter of ['2분기', '3분기', '4분기']) {
    const ws = wb.Sheets[quarter];
    if (ws) {
      Object.assign(out.quarterlyDetails, parseQuarterlySheet(ws));
    }
  }

  return out;
}

// ─────────────────────────────────────────────
// 4. 분기 시트 블록 파싱
// ─────────────────────────────────────────────

/**
 * 2분기/3분기/4분기 시트의 블록 구조를 파싱합니다.
 *
 * **시트 레이아웃 (행 단위):**
 * ```
 * [견적번호]          ← 블록 헤더 행
 *  항목     | 대리점단가 | 하나투어단가
 *  항공     | 1,000,000 | 900,000
 *  지상     | 2,000,000 | 1,800,000
 *  공동경비 |   500,000 | 450,000
 *  넷가     | 3,500,000 | 3,150,000
 *  수익     |   200,000 |  …
 *  입금가   | 3,700,000 |  …
 *  (특이사항 텍스트…)
 * [다음 견적번호]
 * ```
 *
 * 블록 헤더 판별 기준:
 * - A열 값이 비어 있지 않음
 * - 6개 항목 레이블(항공·지상·공동경비·넷가·수익·입금가)에 해당하지 않음
 * - 컬럼 헤더 행(예: '항목', '대리점 단가')이 아님
 *
 * @param {Object} ws - XLSX 워크시트 객체
 * @returns {Object.<string, {
 *   항공:     { 대리점: number, 하나투어: number },
 *   지상:     { 대리점: number, 하나투어: number },
 *   공동경비: { 대리점: number, 하나투어: number },
 *   넷가:     { 대리점: number, 하나투어: number },
 *   수익:     { 대리점: number, 하나투어: number },
 *   입금가:   { 대리점: number, 하나투어: number },
 *   특이사항: string
 * }>} 견적번호(string)를 키로 하는 블록 맵
 */
export function parseQuarterlySheet(ws) {
  if (!ws) return {};

  /** 항목 행으로 인식할 레이블 집합 */
  const ITEM_LABELS = new Set(['항공', '지상', '공동경비', '넷가', '수익', '입금가']);

  /**
   * 컬럼 헤더 행으로 인식할 키워드 집합
   * (XLSX sheet_to_json 사용 시 나타날 수 있는 헤더 행 스킵 용도)
   */
  const SKIP_LABELS = new Set(['항목', '대리점 단가', '하나투어 단가', '구분']);

  /** header: 1 옵션으로 행 배열 획득 (raw 값 유지) */
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

  const result = {};
  let currentKey = null;
  let currentBlock = null;
  let remarkLines = [];

  /** 현재 블록을 result에 확정 저장 */
  const flushBlock = () => {
    if (currentKey && currentBlock) {
      currentBlock.특이사항 = remarkLines.join('\n').trim();
      result[currentKey] = currentBlock;
    }
  };

  /** 빈 블록 초기값 생성 */
  const makeBlock = () => ({
    항공:     { 대리점: 0, 하나투어: 0 },
    지상:     { 대리점: 0, 하나투어: 0 },
    공동경비: { 대리점: 0, 하나투어: 0 },
    넷가:     { 대리점: 0, 하나투어: 0 },
    수익:     { 대리점: 0, 하나투어: 0 },
    입금가:   { 대리점: 0, 하나투어: 0 },
    특이사항: '',
  });

  for (const row of rows) {
    const colA = str(row[0]); // 항목명 또는 견적번호
    const colB = row[1];      // 대리점 단가
    const colC = row[2];      // 하나투어 단가

    if (!colA) continue;              // 완전 빈 행 스킵
    if (SKIP_LABELS.has(colA)) continue; // 헤더 레이블 행 스킵

    if (ITEM_LABELS.has(colA)) {
      // ─ 항목 행: 단가 두 열을 블록에 기록
      if (currentBlock) {
        currentBlock[colA] = {
          대리점:   num(colB),
          하나투어: num(colC),
        };
      }
    } else {
      // ─ 견적번호 행 또는 특이사항 행
      //   견적번호 판별: 영숫자·하이픈·언더스코어로만 구성되고 길이 ≥ 2
      //   특이사항: 그 외 텍스트(한글 포함 등)
      const looksLikeKey = /^[A-Z0-9\-_]+$/i.test(colA) && colA.length >= 2;

      if (looksLikeKey) {
        flushBlock();
        currentKey = colA;
        currentBlock = makeBlock();
        remarkLines = [];
      } else if (currentBlock) {
        // 특이사항 텍스트 누적 (비어 있지 않은 셀만)
        const line = [colA, str(colB), str(colC)].filter(Boolean).join(' ');
        remarkLines.push(line);
      }
    }
  }

  flushBlock(); // 마지막 블록 저장

  return result;
}

// ─────────────────────────────────────────────
// 5. 데이터 병합
// ─────────────────────────────────────────────

/**
 * 기존 저장 데이터와 새로 파싱된 데이터를 키 기준으로 병합(upsert)합니다.
 *
 * | 컬렉션          | 기준 키                              |
 * |----------------|--------------------------------------|
 * | agencies        | 대리점코드                           |
 * | quotes          | 견적번호                             |
 * | dailyLogs       | 날짜 + 대리점코드 + 상품코드 (복합)   |
 * | incentives      | 온라인견적번호 (없으면 대리점명+상품코드+출발일) |
 * | departures      | 대리점명 + 상품코드 + 출발일 (복합)   |
 * | quarterlyDetails| 견적번호 (Object.assign 덮어쓰기)     |
 *
 * incoming 데이터가 existing 데이터를 필드 단위로 덮어씁니다(shallow merge per item).
 *
 * @param {{
 *   agencies: Array<Object>,
 *   quotes: Array<Object>,
 *   dailyLogs: Array<Object>,
 *   incentives: Array<Object>,
 *   departures: Array<Object>,
 *   quarterlyDetails: Object
 * }} existing - 현재 저장된 상태
 * @param {{
 *   agencies: Array<Object>,
 *   quotes: Array<Object>,
 *   dailyLogs: Array<Object>,
 *   incentives: Array<Object>,
 *   departures: Array<Object>,
 *   quarterlyDetails: Object
 * }} incoming - 새로 파싱된 데이터
 * @returns {{
 *   agencies: Array<Object>,
 *   quotes: Array<Object>,
 *   dailyLogs: Array<Object>,
 *   incentives: Array<Object>,
 *   departures: Array<Object>,
 *   quarterlyDetails: Object
 * }}
 */
export function mergeData(existing, incoming) {
  /**
   * Map 기반 upsert: keyFn(item)이 같으면 기존 항목에 incoming 필드를 얕게 병합.
   * keyFn이 빈 문자열을 반환하는 항목(키 없음)은 기존 항목에 단순 추가합니다.
   *
   * @param {Array<Object>} existArr
   * @param {Array<Object>} incomArr
   * @param {(item: Object) => string} keyFn
   * @returns {Array<Object>}
   */
  function upsert(existArr, incomArr, keyFn) {
    const map = new Map();

    // 기존 데이터 로드
    for (const item of existArr ?? []) {
      const k = keyFn(item);
      if (k) map.set(k, item);
      else map.set(Symbol(), item); // 키 없는 항목은 Symbol로 고유 처리
    }

    // incoming upsert
    for (const item of incomArr ?? []) {
      const k = keyFn(item);
      if (k) {
        map.set(k, { ...(map.get(k) ?? {}), ...item });
      } else {
        map.set(Symbol(), item);
      }
    }

    return Array.from(map.values());
  }

  return {
    agencies: upsert(
      existing.agencies,
      incoming.agencies,
      (r) => r.대리점코드,
    ),

    quotes: upsert(
      existing.quotes,
      incoming.quotes,
      (r) => r.견적번호,
    ),

    // 복합키: 날짜 + 대리점코드 + 상품코드
    dailyLogs: upsert(
      existing.dailyLogs,
      incoming.dailyLogs,
      (r) => (r.날짜 && r.대리점코드
        ? `${r.날짜}__${r.대리점코드}__${r.상품코드}`
        : ''),
    ),

    // 온라인견적번호 우선, 없으면 복합키
    incentives: upsert(
      existing.incentives,
      incoming.incentives,
      (r) => r.온라인견적번호
        || (r.대리점명 ? `${r.대리점명}__${r.상품코드}__${r.출발일}` : ''),
    ),

    // 복합키: 대리점명 + 상품코드 + 출발일
    departures: upsert(
      existing.departures,
      incoming.departures,
      (r) => (r.대리점명 && r.출발일
        ? `${r.대리점명}__${r.상품코드}__${r.출발일}`
        : ''),
    ),

    // Object 병합: 같은 견적번호는 incoming으로 덮어씀
    quarterlyDetails: {
      ...(existing.quarterlyDetails ?? {}),
      ...(incoming.quarterlyDetails ?? {}),
    },
  };
}

// ─────────────────────────────────────────────
// 6. 인센티브 정산 요약 계산
// ─────────────────────────────────────────────

/**
 * 인센티브 건의 정산 요약 수치를 계산합니다.
 *
 * 계산식:
 * - `totalRevenue`  = 인센정리.총매출액  (없으면 최종입금가 × 인원수)
 * - `하나투어수익`   = 인센정리.하나투어수익
 * - `marginRate`    = 하나투어수익 / totalRevenue × 100  (소수 2자리)
 * - `지상비차이`    = 인센정리.지상비 − (분기시트.지상.하나투어단가 × 인원수)
 *
 * @param {{
 *   인원수?: number,
 *   최종입금가?: number,
 *   총매출액?: number,
 *   하나투어수익?: number,
 *   지상비?: number
 * }} incentive - 인센정리 시트 행 데이터
 * @param {{
 *   지상?: { 대리점: number, 하나투어: number },
 *   넷가?: { 대리점: number, 하나투어: number },
 *   수익?: { 대리점: number, 하나투어: number },
 *   입금가?: { 대리점: number, 하나투어: number }
 * } | null | undefined} quarterlyDetail - 해당 견적번호의 분기 블록 (없으면 null)
 * @returns {{
 *   totalRevenue: number,
 *   하나투어수익: number,
 *   marginRate: number,
 *   지상비차이: number
 * }}
 */
export function calcIncentiveSummary(incentive, quarterlyDetail) {
  const pax = num(incentive?.인원수);
  const totalRevenue = num(incentive?.총매출액) || num(incentive?.최종입금가) * pax;
  const 하나투어수익 = num(incentive?.하나투어수익);
  const marginRate = totalRevenue > 0
    ? Math.round((하나투어수익 / totalRevenue) * 10000) / 100 // 소수 2자리
    : 0;

  // 분기 시트의 지상 하나투어 단가 × 인원수와 실제 지상비의 차이
  const qGroundPerPax = num(quarterlyDetail?.지상?.하나투어);
  const 지상비차이 = num(incentive?.지상비) - qGroundPerPax * pax;

  return { totalRevenue, 하나투어수익, marginRate, 지상비차이 };
}

// ─────────────────────────────────────────────
// 7. 포맷 유틸리티
// ─────────────────────────────────────────────

/**
 * 숫자를 한국 원화(KRW) 포맷 문자열로 변환합니다.
 *
 * @example
 * formatKRW(1234567)  // '1,234,567원'
 * formatKRW(0)        // '0원'
 * formatKRW(null)     // '0원'
 * formatKRW(-500000)  // '-500,000원'
 *
 * @param {number | string | null | undefined} n
 * @returns {string}
 */
export function formatKRW(n) {
  const v = Number(n);
  if (!isFinite(v)) return '0원';
  return v.toLocaleString('ko-KR') + '원';
}

// ─────────────────────────────────────────────
// 8. 대리점 유형 분류
// ─────────────────────────────────────────────

/**
 * 대리점 데이터의 **보고구분** 필드를 기준으로 대리점 유형을 반환합니다.
 *
 * @example
 * getAgencyType({ 보고구분: '공식인증' })  // '공식인증'
 * getAgencyType({ 보고구분: '일반대리점' }) // '일반대리점'
 * getAgencyType({})                         // '일반대리점'  (기본값)
 *
 * @param {{ 보고구분?: string } | null | undefined} agency
 * @returns {'공식인증' | '일반대리점'}
 */
export function getAgencyType(agency) {
  return agency?.보고구분 === '공식인증' ? '공식인증' : '일반대리점';
}
