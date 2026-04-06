'use client';

/**
 * app/page.js
 * 하나투어 영업·인센티브 통합 대시보드 — 전체 상태 허브
 *
 * 이 파일이 앱의 단일 진실 공급원(Single Source of Truth)입니다.
 * 모든 데이터 상태와 핸들러를 여기서 관리하고, 각 탭 컴포넌트에 props로 내려줍니다.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import {
  Tabs,
  Space,
  Typography,
  Button,
  Tooltip,
  Tag,
  App,
  Divider,
  Modal,
  Input,
} from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  ImportOutlined,
  ReloadOutlined,
  WarningOutlined,
  GlobalOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';

import { mergeData, EMPTY_STATE } from '@/lib/store';
import {
  loadAllData, bulkSaveAll, clearAllData,
  upsertAgency, deleteAgencyDB,
  upsertQuote, deleteQuoteDB,
  upsertIncentive, deleteIncentiveDB,
  upsertDailyLog, deleteDailyLogDB,
} from '@/lib/supabase';
import WeeklyTab    from '@/components/tabs/WeeklyTab';
import AgencyTab    from '@/components/tabs/AgencyTab';
import PipelineTab  from '@/components/tabs/PipelineTab';
import IncentiveTab from '@/components/tabs/IncentiveTab';
import CalendarTab  from '@/components/tabs/CalendarTab';
import DailyLogTab  from '@/components/tabs/DailyLogTab';
import ImportTab    from '@/components/tabs/ImportTab';

dayjs.locale('ko');

// ─────────────────────────────────────────────
// 샘플 데이터 (localStorage가 비어 있을 때 사용)
// ─────────────────────────────────────────────

const SAMPLE_DATA = {
  agencies: [
    { 대리점코드: 'AG001', 대리점명: '(주)하나여행사', 대리점유형: '여행사', 점형태: '법인', 내부등급: 'VIP', 팀: '영업1팀', 부서: '국내영업부', 담당자: '김민준', 보고구분: '공식인증',  관리등급: 'A', 특징: '단체 전문',  다음액션: '월례 미팅', 최근접촉일: '2026-04-01', 메모: '주요 거래처' },
    { 대리점코드: 'AG002', 대리점명: '태양관광(주)',   대리점유형: '관광',   점형태: '법인', 내부등급: '일반', 팀: '영업2팀', 부서: '국내영업부', 담당자: '이수빈', 보고구분: '일반대리점', 관리등급: 'B', 특징: '허니문 특화', 다음액션: '가격 재협의', 최근접촉일: '2026-03-28', 메모: '' },
    { 대리점코드: 'AG003', 대리점명: '미래투어',       대리점유형: '여행사', 점형태: '개인', 내부등급: '일반', 팀: '영업1팀', 부서: '국내영업부', 담당자: '박지훈', 보고구분: '공식인증',  관리등급: 'A', 특징: '기업 단체',  다음액션: '견적 발송', 최근접촉일: '2026-03-30', 메모: '3분기 대형 건 예정' },
    { 대리점코드: 'AG004', 대리점명: '드림여행사',     대리점유형: '여행사', 점형태: '법인', 내부등급: '신규', 팀: '영업3팀', 부서: '국내영업부', 담당자: '최유나', 보고구분: '일반대리점', 관리등급: 'C', 특징: '패키지 위주', 다음액션: '첫 미팅',    최근접촉일: '2026-04-03', 메모: '신규 개발 대리점' },
  ],
  quotes: [
    { 견적번호: 'QJ00685501001', 대리점코드: 'AG001', 대리점명: '(주)하나여행사', 등록일: '2026-04-01', 출발일: '2026-06-15', 인원: 25, 가격: 1850000, 상품코드: 'ATQ053260615OZ1', 상태: '협의중', 보고구분: '공식인증', 다음할일: '가격 재협의', 메모: '' },
    { 견적번호: 'QJ00685501002', 대리점코드: 'AG002', 대리점명: '태양관광(주)',   등록일: '2026-03-28', 출발일: '2026-07-20', 인원: 40, 가격: 2200000, 상품코드: 'ATQ053260720KE1', 상태: '체결',   보고구분: '일반대리점', 다음할일: '계약금 수령', 메모: '확정' },
    { 견적번호: 'QJ00685501003', 대리점코드: 'AG003', 대리점명: '미래투어',       등록일: '2026-04-02', 출발일: '2026-08-10', 인원: 30, 가격: 3100000, 상품코드: 'ATQ053260810UA1', 상태: '미체결', 보고구분: '공식인증',  다음할일: '대안 상품 제안', 메모: '가격 이슈' },
    { 견적번호: 'QJ00685501004', 대리점코드: 'AG001', 대리점명: '(주)하나여행사', 등록일: '2026-04-04', 출발일: '2026-09-05', 인원: 50, 가격: 2750000, 상품코드: 'ATQ053260905OZ2', 상태: '협의중', 보고구분: '공식인증',  다음할일: '추가 옵션 협의', 메모: '' },
  ],
  dailyLogs: [
    { 날짜: '2026-04-02', 주차: '2026-04-01', 대리점코드: 'AG001', 대리점명: '(주)하나여행사', 보고구분: '공식인증',  업무구분: '견적', 상품코드: 'ATQ053260615OZ1', 견적인입여부: 1, 체결여부: 0, 인원: 25, 매출: 0,          내용: '유럽 패키지 견적 협의',  다음액션: '가격 재협의', 상태: '진행중' },
    { 날짜: '2026-04-03', 주차: '2026-04-01', 대리점코드: 'AG002', 대리점명: '태양관광(주)',   보고구분: '일반대리점', 업무구분: '예약', 상품코드: 'ATQ053260720KE1', 견적인입여부: 1, 체결여부: 1, 인원: 40, 매출: 88000000, 내용: '일본 단체 예약 확정',  다음액션: '계약금 수령', 상태: '완료' },
    { 날짜: '2026-04-04', 주차: '2026-04-01', 대리점코드: 'AG003', 대리점명: '미래투어',       보고구분: '공식인증',  업무구분: '견적', 상품코드: 'ATQ053260810UA1', 견적인입여부: 1, 체결여부: 0, 인원: 30, 매출: 0,          내용: '미국 기업 단체 견적 발송', 다음액션: '대안 상품 준비', 상태: '진행중' },
    { 날짜: '2026-04-05', 주차: '2026-04-01', 대리점코드: 'AG004', 대리점명: '드림여행사',     보고구분: '일반대리점', 업무구분: '기타', 상품코드: '',                  견적인입여부: 0, 체결여부: 0, 인원: 0,  매출: 0,          내용: '신규 대리점 첫 미팅',   다음액션: '견적 준비',    상태: '완료' },
    { 날짜: '2026-04-06', 주차: '2026-04-01', 대리점코드: 'AG001', 대리점명: '(주)하나여행사', 보고구분: '공식인증',  업무구분: '견적', 상품코드: 'ATQ053260905OZ2', 견적인입여부: 1, 체결여부: 0, 인원: 50, 매출: 0,          내용: '9월 유럽 대형 견적 협의', 다음액션: '추가 옵션 협의', 상태: '진행중' },
  ],
  incentives: [
    {
      대리점명: '태양관광(주)', 키맨: '이대표', 상품담당자: '박팀장', 상품코드: 'ATQ053260720KE1',
      지역: '일본', 온라인견적번호: 'QJ00685501002', 출발일: '2026-07-20', 인원수: 40,
      최초입금가: 2200000, 최종입금가: 2150000, 최종넷가: 1980000,
      총매출액: 86000000, 하나투어수익: 6800000,
      선발권여부: 'O', 발권여부: 'X', 체결여부: '체결',
      팀컬러: '레드', 지상비: 45000000, 지상특이사항: '현지 버스 추가',
      호텔명: '도쿄 힐튼', 호텔특이사항: '',
      추가옵션여부: 'O', 추가옵션내용: '공연 관람 패키지', 가이드형태: '한국인',
      계약금납입여부: 'O', 입금완료: 'X', 입금가변동: 'X',
      특이사항: '', 업데이트일: '2026-04-03',
    },
  ],
  departures: [
    { 대리점명: '태양관광(주)',   상품코드: 'ATQ053260720KE1', 인원: 40, 출발일: '2026-07-20', dday: 105 },
    { 대리점명: '(주)하나여행사', 상품코드: 'ATQ053260615OZ1', 인원: 25, 출발일: '2026-06-15', dday: 70 },
    { 대리점명: '미래투어',       상품코드: 'ATQ053260810UA1', 인원: 30, 출발일: '2026-08-10', dday: 126 },
    { 대리점명: '(주)하나여행사', 상품코드: 'ATQ053260905OZ2', 인원: 50, 출발일: '2026-09-05', dday: 152 },
  ],
  quarterlyDetails: {},
};

// ─────────────────────────────────────────────
// 탭 건수 뱃지 헬퍼
// ─────────────────────────────────────────────

function CountBadge({ count, color = '#0054A6' }) {
  if (!count) return null;
  return (
    <span
      style={{
        background: color,
        color: '#fff',
        borderRadius: 10,
        padding: '1px 7px',
        fontSize: 11,
        fontWeight: 700,
        marginLeft: 5,
        minWidth: 20,
        display: 'inline-block',
        textAlign: 'center',
        lineHeight: '18px',
        verticalAlign: 'middle',
      }}
    >
      {count > 9999 ? `${Math.floor(count / 1000)}k` : count.toLocaleString()}
    </span>
  );
}

// ─────────────────────────────────────────────
// 헤더 통계 칩
// ─────────────────────────────────────────────

function StatChip({ label, value, color = 'rgba(255,255,255,0.15)' }) {
  return (
    <div
      style={{
        background: color,
        borderRadius: 8,
        padding: '4px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 56,
      }}
    >
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 페이지 컴포넌트
// ─────────────────────────────────────────────

export default function DashboardContent() {
  // ── 앱 전역 상태 ──────────────────────────
  const [agencies,   setAgencies]   = useState([]);
  const [quotes,     setQuotes]     = useState([]);
  const [dailyLogs,  setDailyLogs]  = useState([]);
  const [incentives, setIncentives] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [quarterly,  setQuarterly]  = useState({});
  const searchParams = useSearchParams();
  const [activeTab,  setActiveTab]  = useState(() => searchParams.get('tab') || 'weekly');

  const [loaded, setLoaded] = useState(false);

  // ── 관리자 인증 ──
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');

  // sessionStorage에서 관리자 상태 복원
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('isAdmin') === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = useCallback(() => {
    if (loginPw === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAdmin(true);
      sessionStorage.setItem('isAdmin', 'true');
      setShowLoginModal(false);
      setLoginPw('');
      setLoginError('');
    } else {
      setLoginError('비밀번호가 올바르지 않습니다');
    }
  }, [loginPw]);

  const handleLogout = useCallback(() => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
  }, []);

  // antd App 컨텍스트 (Modal.confirm 대체)
  const { modal } = App.useApp();

  // ── 초기 로드: Supabase → 샘플 데이터 ────
  useEffect(() => {
    async function init() {
      try {
        console.log('[dashboard] 데이터 로드 시작...');
        const saved = await loadAllData();
        console.log('[dashboard] loadAllData 결과:', {
          agencies: saved?.agencies?.length ?? 0,
          quotes: saved?.quotes?.length ?? 0,
          dailyLogs: saved?.dailyLogs?.length ?? 0,
          incentives: saved?.incentives?.length ?? 0,
        });

        const hasData =
          saved &&
          (saved.agencies?.length ||
            saved.quotes?.length ||
            saved.dailyLogs?.length ||
            saved.incentives?.length);

        if (hasData) {
          setAgencies(saved.agencies   ?? []);
          setQuotes(saved.quotes       ?? []);
          setDailyLogs(saved.dailyLogs ?? []);
          setIncentives(saved.incentives ?? []);
          console.log('[dashboard] Supabase 데이터 로드 완료');
        } else {
          console.log('[dashboard] DB 비어있음 → 샘플 데이터 사용');
          setAgencies(SAMPLE_DATA.agencies);
          setQuotes(SAMPLE_DATA.quotes);
          setDailyLogs(SAMPLE_DATA.dailyLogs);
          setIncentives(SAMPLE_DATA.incentives);
          setDepartures(SAMPLE_DATA.departures);
          setQuarterly(SAMPLE_DATA.quarterlyDetails);
          await bulkSaveAll(SAMPLE_DATA);
        }
      } catch (err) {
        console.error('[dashboard] 초기 로드 실패:', err);
        setAgencies(SAMPLE_DATA.agencies);
        setQuotes(SAMPLE_DATA.quotes);
        setDailyLogs(SAMPLE_DATA.dailyLogs);
        setIncentives(SAMPLE_DATA.incentives);
      }
      setLoaded(true);
    }
    init();
  }, []);

  // ─────────────────────────────────────────
  // 핸들러 함수
  // ─────────────────────────────────────────

  /**
   * 엑셀 파싱 결과를 현재 데이터와 병합하고 상태를 업데이트합니다.
   * @param {{ agencies, quotes, dailyLogs, incentives, departures, quarterlyDetails }} data
   */
  const handleImport = useCallback(async (data) => {
    const merged = mergeData(
      { agencies, quotes, dailyLogs, incentives, departures, quarterlyDetails: quarterly },
      data,
    );
    setAgencies(merged.agencies);
    setQuotes(merged.quotes);
    setDailyLogs(merged.dailyLogs);
    setIncentives(merged.incentives);
    setDepartures(merged.departures);
    setQuarterly(merged.quarterlyDetails);
    setActiveTab('weekly');
    await bulkSaveAll(merged);
  }, [agencies, quotes, dailyLogs, incentives, departures, quarterly]);

  // ─────────────────────────────────────────
  // CRUD 핸들러: 대리점
  // ─────────────────────────────────────────

  const handleAddAgency = useCallback(async (newAgency) => {
    setAgencies((prev) => [newAgency, ...prev]);
    await upsertAgency(newAgency);
  }, []);

  const handleUpdateAgency = useCallback(async (code, patch) => {
    let updated;
    setAgencies((prev) =>
      prev.map((a) => {
        if (a.대리점코드 === code) { updated = { ...a, ...patch }; return updated; }
        return a;
      }),
    );
    if (updated) await upsertAgency(updated);
  }, []);

  const handleDeleteAgency = useCallback(async (code, cascade = false) => {
    setAgencies((prev) => prev.filter((a) => a.대리점코드 !== code));
    await deleteAgencyDB(code);
    if (cascade) {
      setQuotes((prev) => prev.filter((q) => q.대리점코드 !== code));
      setDailyLogs((prev) => prev.filter((l) => l.대리점코드 !== code));
      // cascade DB 삭제는 간단히 전체 재저장
    }
  }, []);

  // ─────────────────────────────────────────
  // CRUD 핸들러: 견적
  // ─────────────────────────────────────────

  const handleAddQuote = useCallback(async (newQuote) => {
    setQuotes((prev) => [newQuote, ...prev]);
    await upsertQuote(newQuote);
  }, []);

  const handleUpdateQuote = useCallback(async (updatedQuote) => {
    setQuotes((prev) =>
      prev.map((q) =>
        q.견적번호 === updatedQuote.견적번호 ? { ...q, ...updatedQuote } : q,
      ),
    );
    await upsertQuote(updatedQuote);
    if (updatedQuote.견적번호 && updatedQuote.상태) {
      const incStatus = updatedQuote.상태 === '체결' ? '체결' : '미체결';
      setIncentives((prev) =>
        prev.map((i) => {
          if (i.온라인견적번호 === updatedQuote.견적번호) {
            const upd = { ...i, 체결여부: incStatus };
            upsertIncentive(upd);
            return upd;
          }
          return i;
        }),
      );
    }
  }, []);

  const handleDeleteQuote = useCallback(async (quoteId) => {
    setQuotes((prev) => prev.filter((q) => q.견적번호 !== quoteId));
    setIncentives((prev) => prev.filter((i) => i.온라인견적번호 !== quoteId));
    await deleteQuoteDB(quoteId);
    await deleteIncentiveDB(quoteId);
  }, []);

  // ─────────────────────────────────────────
  // CRUD 핸들러: 인센티브
  // ─────────────────────────────────────────

  const handleUpdateIncentive = useCallback(async (updatedIncentive) => {
    setIncentives((prev) =>
      prev.map((i) =>
        i.온라인견적번호 === updatedIncentive.온라인견적번호
          ? { ...i, ...updatedIncentive }
          : i,
      ),
    );
    await upsertIncentive(updatedIncentive);
    if (updatedIncentive.온라인견적번호 && updatedIncentive.체결여부) {
      const quoteStatus = updatedIncentive.체결여부 === '체결' ? '체결' : '미체결';
      setQuotes((prev) =>
        prev.map((q) => {
          if (q.견적번호 === updatedIncentive.온라인견적번호) {
            const upd = { ...q, 상태: quoteStatus };
            upsertQuote(upd);
            return upd;
          }
          return q;
        }),
      );
    }
  }, []);

  const handleDeleteIncentive = useCallback(async (quoteId) => {
    setIncentives((prev) => prev.filter((i) => i.온라인견적번호 !== quoteId));
    await deleteIncentiveDB(quoteId);
  }, []);

  // ─────────────────────────────────────────
  // CRUD 핸들러: Daily Log
  // ─────────────────────────────────────────

  const handleAddLog = useCallback(async (newLog) => {
    setDailyLogs((prev) => [newLog, ...prev]);
    await upsertDailyLog(newLog);
  }, []);

  const handleUpdateLog = useCallback(async (compositeKey, patch) => {
    let updated;
    setDailyLogs((prev) =>
      prev.map((l) => {
        const key = `${l.날짜}__${l.대리점코드}__${l.상품코드}`;
        if (key === compositeKey) { updated = { ...l, ...patch }; return updated; }
        return l;
      }),
    );
    if (updated) await upsertDailyLog(updated);
  }, []);

  const handleDeleteLog = useCallback(async (compositeKey) => {
    setDailyLogs((prev) =>
      prev.filter((l) => `${l.날짜}__${l.대리점코드}__${l.상품코드}` !== compositeKey),
    );
    await deleteDailyLogDB(compositeKey);
  }, []);

  /**
   * 모든 상태를 초기화합니다 (localStorage 포함).
   * Modal.confirm으로 사용자에게 재확인합니다.
   */
  const handleReset = useCallback(() => {
    modal.confirm({
      title: '데이터 초기화',
      icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <Typography.Text>
            모든 데이터(대리점 · 견적 · 로그 · 인센티브)가 삭제됩니다.
          </Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            이 작업은 되돌릴 수 없습니다.
          </Typography.Text>
        </div>
      ),
      okText: '초기화',
      okType: 'danger',
      cancelText: '취소',
      onOk() {
        setAgencies([]);
        setQuotes([]);
        setDailyLogs([]);
        setIncentives([]);
        setDepartures([]);
        setQuarterly({});
        setActiveTab('import');
        clearAllData();
      },
    });
  }, [modal]);

  // ─────────────────────────────────────────
  // 집계 값 (헤더 통계 · 탭 뱃지 용)
  // ─────────────────────────────────────────

  const stats = {
    agencies:   agencies.length,
    quotes:     quotes.length,
    settled:    quotes.filter((q) => q.상태 === '체결').length,
    incentives: incentives.length,
    dailyLogs:  dailyLogs.length,
    departures: departures.length,
    quarterly:  Object.keys(quarterly).length,
  };

  // ─────────────────────────────────────────
  // 탭 정의
  // ─────────────────────────────────────────

  const tabItems = [
    {
      key: 'weekly',
      label: (
        <span>
          <CalendarOutlined /> 주간 보고
          <CountBadge count={stats.dailyLogs} color="#0054A6" />
        </span>
      ),
      children: (
        <WeeklyTab
          agencies={agencies}
          quotes={quotes}
          dailyLogs={dailyLogs}
        />
      ),
    },
    {
      key: 'agency',
      label: (
        <span>
          <TeamOutlined /> 대리점 관리
          <CountBadge count={stats.agencies} color="#1677ff" />
        </span>
      ),
      children: (
        <AgencyTab
          isAdmin={isAdmin}
          agencies={agencies}
          quotes={quotes}
          dailyLogs={dailyLogs}
          onAddAgency={handleAddAgency}
          onUpdateAgency={handleUpdateAgency}
          onDeleteAgency={handleDeleteAgency}
        />
      ),
    },
    {
      key: 'pipeline',
      label: (
        <span>
          <FileTextOutlined /> 견적 파이프라인
          <CountBadge count={stats.quotes} color="#fa8c16" />
        </span>
      ),
      children: (
        <PipelineTab
          isAdmin={isAdmin}
          quotes={quotes}
          agencies={agencies}
          incentives={incentives}
          quarterly={quarterly}
          onAddQuote={handleAddQuote}
          onUpdateQuote={handleUpdateQuote}
          onDeleteQuote={handleDeleteQuote}
          onUpdateIncentive={handleUpdateIncentive}
        />
      ),
    },
    {
      key: 'incentive',
      label: (
        <span>
          <DollarOutlined /> 인센티브 정산
          <CountBadge count={stats.incentives} color="#722ed1" />
        </span>
      ),
      children: (
        <IncentiveTab
          isAdmin={isAdmin}
          incentives={incentives}
          quarterly={quarterly}
          quotes={quotes}
          departures={departures}
          onUpdateIncentive={handleUpdateIncentive}
          onDeleteIncentive={handleDeleteIncentive}
        />
      ),
    },
    {
      key: 'calendar',
      label: (
        <span>
          <ScheduleOutlined /> 출발 달력
          <CountBadge count={stats.departures} color="#13c2c2" />
        </span>
      ),
      children: (
        <CalendarTab
          departures={departures}
          quotes={quotes}
          incentives={incentives}
          quarterly={quarterly}
          onUpdateQuote={handleUpdateQuote}
          onUpdateIncentive={handleUpdateIncentive}
        />
      ),
    },
    {
      key: 'dailylog',
      label: (
        <span>
          <BarChartOutlined /> 일일 활동 로그
          <CountBadge count={stats.dailyLogs} color="#52c41a" />
        </span>
      ),
      children: (
        <DailyLogTab
          isAdmin={isAdmin}
          dailyLogs={dailyLogs}
          agencies={agencies}
          onAddLog={handleAddLog}
          onUpdateLog={handleUpdateLog}
          onDeleteLog={handleDeleteLog}
        />
      ),
    },
    {
      key: 'import',
      label: (
        <span>
          <ImportOutlined /> 데이터 임포트
        </span>
      ),
      children: <ImportTab onImport={handleImport} />,
    },
  ];

  // ─────────────────────────────────────────
  // 렌더
  // ─────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* ── 헤더 ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '0 24px',
          background: 'linear-gradient(135deg, #5C2D91 0%, #7B3DB5 50%, #00B4C8 100%)',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* 로고 — 클릭 시 랜딩 페이지로 이동 */}
          <Space size={10} style={{ flexShrink: 0 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#fff',
                  color: '#5C2D91',
                  fontWeight: 900,
                  fontSize: 17,
                  letterSpacing: 2,
                  padding: '4px 10px',
                  borderRadius: 6,
                  lineHeight: 1.4,
                  cursor: 'pointer',
                }}
              >
                HANA
              </div>
            </Link>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                영업 · 인센티브 통합 관리
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
                Hanatour Sales &amp; Incentive Dashboard
              </div>
            </div>
          </Space>

          <Divider orientation="vertical" style={{ background: 'rgba(255,255,255,0.3)', height: 32, margin: '0 4px' }} />

          {/* 통계 칩 */}
          <Space size={8} wrap style={{ flex: 1 }}>
            <StatChip label="대리점" value={stats.agencies} />
            <StatChip label="견적"   value={stats.quotes} />
            <StatChip label="체결"   value={stats.settled} color="rgba(82,196,26,0.25)" />
            <StatChip label="인센"   value={stats.incentives} color="rgba(114,46,209,0.25)" />
            {stats.dailyLogs > 0 && (
              <StatChip label="로그" value={stats.dailyLogs} />
            )}
          </Space>

          {/* 담당자 · 날짜 · 초기화 */}
          <Space size={8} style={{ flexShrink: 0, marginLeft: 'auto' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, whiteSpace: 'nowrap' }}>
              영업2팀 왕유빈
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 2px' }}>|</span>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, whiteSpace: 'nowrap' }}>
              {dayjs().format('YYYY.MM.DD (ddd)')}
            </Typography.Text>
            {isAdmin && (
              <Tooltip title="모든 데이터 초기화">
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    borderRadius: 6,
                  }}
                />
              </Tooltip>
            )}
            <Tooltip title={isAdmin ? '관리자 로그아웃' : '관리자 로그인'}>
              <Button
                size="small"
                icon={isAdmin ? <UnlockOutlined /> : <LockOutlined />}
                onClick={isAdmin ? handleLogout : () => setShowLoginModal(true)}
                style={{
                  background: isAdmin ? 'rgba(82,196,26,0.25)' : 'rgba(255,255,255,0.15)',
                  border: `1px solid ${isAdmin ? 'rgba(82,196,26,0.5)' : 'rgba(255,255,255,0.3)'}`,
                  color: '#fff',
                  borderRadius: 6,
                }}
              />
            </Tooltip>
          </Space>
        </div>
      </header>

      {/* ── 관리자 로그인 모달 ── */}
      <Modal
        open={showLoginModal}
        onCancel={() => { setShowLoginModal(false); setLoginPw(''); setLoginError(''); }}
        title={<Space><LockOutlined style={{ color: '#5C2D91' }} /><span>관리자 로그인</span></Space>}
        centered
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={() => { setShowLoginModal(false); setLoginPw(''); setLoginError(''); }}>취소</Button>,
          <Button key="login" type="primary" onClick={handleLogin} style={{ background: '#5C2D91' }}>로그인</Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            데이터 수정/삭제/추가를 위해 관리자 비밀번호를 입력하세요.
          </Typography.Text>
          <Input.Password
            size="large"
            placeholder="비밀번호 입력"
            value={loginPw}
            onChange={(e) => { setLoginPw(e.target.value); setLoginError(''); }}
            onPressEnter={handleLogin}
            status={loginError ? 'error' : ''}
          />
          {loginError && (
            <Typography.Text type="danger" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
              {loginError}
            </Typography.Text>
          )}
        </div>
      </Modal>

      {/* ── 탭 영역 ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="middle"
          style={{ marginTop: 0 }}
          tabBarStyle={{
            background: '#fff',
            margin: '0 -24px',
            padding: '0 24px',
            position: 'sticky',
            top: 64,          // 헤더 높이와 동일
            zIndex: 90,
            boxShadow: '0 1px 4px rgba(0,84,166,0.08)',
            marginBottom: 0,
          }}
          tabBarGutter={4}
          destroyOnHidden={false}
        />
      </div>

    </div>
  );
}
