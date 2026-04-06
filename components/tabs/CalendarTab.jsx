'use client';

/**
 * components/tabs/CalendarTab.jsx
 * 출발 달력 탭 — 견적/인센/출발일관리 3종 병합 달력 + D-day 사이드 패널
 */

import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Typography, Calendar, Tag, Space, Card, Row, Col,
  Drawer, List, Badge, Button, Divider, App,
} from 'antd';
import {
  ScheduleOutlined, CalendarOutlined, WarningOutlined,
  ClockCircleOutlined, TeamOutlined, DollarOutlined,
  FileTextOutlined, RightOutlined,
} from '@ant-design/icons';
import { formatKRW } from '@/lib/store';
import IncentiveDetailModal from '@/components/IncentiveDetailModal';

// ─────────────────────────────────────────────
// 이벤트 타입 정의
// ─────────────────────────────────────────────

// type = 'quote' (견적 체결, 정산 미연결) | 'incentive' (인센 정산 완료)
// urgent = D-day <= 7 (출발일관리 시트 기준)

function buildCalendarEvents(quotes, incentives, departures) {
  const events = new Map(); // key: 'YYYY-MM-DD' → Array<event>

  const push = (dateStr, evt) => {
    if (!dateStr) return;
    if (!events.has(dateStr)) events.set(dateStr, []);
    events.get(dateStr).push(evt);
  };

  // 인센 견적번호 세트 (정산 완료 판단용)
  const incentiveKeys = new Set(
    incentives.filter((i) => i.체결여부 === '체결').map((i) => i.온라인견적번호),
  );

  // D-day <= 7 출발일관리 날짜 세트
  const urgentDates = new Set(
    departures.filter((d) => d.dday >= 0 && d.dday <= 7).map((d) => d.출발일),
  );

  // 1. 인센정리 체결 건 → 초록 뱃지
  for (const inc of incentives) {
    if (inc.체결여부 !== '체결' || !inc.출발일) continue;
    push(inc.출발일, {
      type: 'incentive',
      label: inc.대리점명,
      인원: inc.인원수 || 0,
      urgent: urgentDates.has(inc.출발일),
      record: inc,
      quoteNo: inc.온라인견적번호,
    });
  }

  // 2. 견적정리 체결 건 (인센에 없는 것만) → 파란 뱃지
  for (const q of quotes) {
    if (q.상태 !== '체결' || !q.출발일) continue;
    if (incentiveKeys.has(q.견적번호)) continue; // 이미 인센에서 처리됨
    push(q.출발일, {
      type: 'quote',
      label: q.대리점명,
      인원: q.인원 || 0,
      urgent: urgentDates.has(q.출발일),
      record: q,
      quoteNo: q.견적번호,
    });
  }

  return events;
}

// ─────────────────────────────────────────────
// D-day 사이드 패널 아이템
// ─────────────────────────────────────────────

function buildDdayList(departures, incentives, quotes) {
  const today = dayjs();
  const incentiveMap = new Map(incentives.map((i) => [i.온라인견적번호, i]));

  return departures
    .filter((d) => {
      const diff = d.출발일 ? dayjs(d.출발일).diff(today, 'day') : -1;
      return diff >= 0 && diff <= 7;
    })
    .map((d) => {
      const diff = dayjs(d.출발일).diff(today, 'day');
      // 연결된 인센 or 견적 찾기
      const matchedInc = incentives.find(
        (i) => i.출발일 === d.출발일 && i.대리점명 === d.대리점명,
      );
      const matchedQuote = quotes.find(
        (q) => q.출발일 === d.출발일 && q.대리점명 === d.대리점명 && q.상태 === '체결',
      );
      return { ...d, dday: diff, matchedInc, matchedQuote };
    })
    .sort((a, b) => a.dday - b.dday);
}

// ─────────────────────────────────────────────
// 뱃지 컴포넌트
// ─────────────────────────────────────────────

function EventBadge({ evt, onClick }) {
  const isIncentive = evt.type === 'incentive';
  const bg = isIncentive ? '#f6ffed' : '#e6f4ff';
  const borderColor = evt.urgent ? '#ff4d4f' : (isIncentive ? '#b7eb8f' : '#91caff');
  const textColor = isIncentive ? '#389e0d' : '#0958d9';

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick?.(evt); }}
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        borderWidth: evt.urgent ? 2 : 1,
        borderRadius: 4,
        padding: '1px 6px',
        marginBottom: 2,
        cursor: 'pointer',
        fontSize: 11,
        lineHeight: '16px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        color: textColor,
      }}
      title={`${evt.label} / ${evt.인원}명${evt.urgent ? ' (D-7 이내)' : ''}`}
    >
      {evt.label} / {evt.인원}명
    </div>
  );
}

// ─────────────────────────────────────────────
// 날짜 Drawer (해당 날짜 모든 출발 건)
// ─────────────────────────────────────────────

function DateDrawer({ open, date, events, onClose, onClickEvent }) {
  if (!date) return null;
  const dateStr = date.format('YYYY-MM-DD');
  const items = events?.get(dateStr) || [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <Space>
          <CalendarOutlined style={{ color: '#0054A6' }} />
          <span>{date.format('YYYY년 MM월 DD일 (ddd)')}</span>
          <Tag color="blue">{items.length}건</Tag>
        </Space>
      }
      width={400}
    >
      {items.length === 0 ? (
        <Typography.Text type="secondary">해당 날짜에 출발 예정 건이 없습니다.</Typography.Text>
      ) : (
        <List
          dataSource={items}
          renderItem={(evt) => {
            const isInc = evt.type === 'incentive';
            return (
              <List.Item
                onClick={() => onClickEvent?.(evt)}
                style={{ cursor: 'pointer', padding: '12px 0' }}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: isInc ? '#f6ffed' : '#e6f4ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: evt.urgent ? '2px solid #ff4d4f' : undefined,
                    }}>
                      {isInc
                        ? <DollarOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                        : <FileTextOutlined style={{ color: '#1677ff', fontSize: 18 }} />}
                    </div>
                  }
                  title={
                    <Space>
                      <Typography.Text strong>{evt.label}</Typography.Text>
                      <Tag color={isInc ? 'success' : 'blue'} style={{ fontSize: 10 }}>
                        {isInc ? '정산 완료' : '견적 체결'}
                      </Tag>
                      {evt.urgent && <Tag color="error" style={{ fontSize: 10 }}>D-7</Tag>}
                    </Space>
                  }
                  description={
                    <Space orientation="vertical" size={2}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {evt.인원}명 · {evt.quoteNo || '—'}
                      </Typography.Text>
                    </Space>
                  }
                />
                <RightOutlined style={{ color: '#ccc' }} />
              </List.Item>
            );
          }}
        />
      )}
    </Drawer>
  );
}

// ─────────────────────────────────────────────
// 간단한 견적 모달 (QuoteDetailModal 경량 버전)
// ─────────────────────────────────────────────

function QuoteMiniModal({ open, quote, onClose }) {
  if (!quote) return null;
  return (
    <Drawer open={open} onClose={onClose} width={380}
      title={<Space><FileTextOutlined style={{ color: '#1677ff' }} /><span>견적 상세</span>
        <Typography.Text code style={{ fontSize: 12 }}>{quote.견적번호}</Typography.Text></Space>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          ['대리점명', quote.대리점명],
          ['상품코드', quote.상품코드],
          ['출발일', quote.출발일],
          ['인원', `${quote.인원 || 0}명`],
          ['가격', quote.가격 > 0 ? formatKRW(quote.가격) : '—'],
          ['상태', quote.상태],
          ['다음할일', quote.다음할일],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', gap: 8 }}>
            <Typography.Text type="secondary" style={{ width: 70, flexShrink: 0, fontSize: 12 }}>{label}</Typography.Text>
            <Typography.Text>{val || '—'}</Typography.Text>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function CalendarTab({
  departures = [],
  quotes = [],
  incentives = [],
  quarterly = {},
  onUpdateQuote,
  onUpdateIncentive,
}) {
  const { message } = App.useApp();

  const [drawerDate, setDrawerDate]       = useState(null);
  const [selectedIncent, setSelectedIncent] = useState(null);
  const [selectedQuote, setSelectedQuote]   = useState(null);

  // ── 이벤트 맵 빌드 ──
  const events = useMemo(
    () => buildCalendarEvents(quotes, incentives, departures),
    [quotes, incentives, departures],
  );

  // ── D-day 리스트 ──
  const ddayList = useMemo(
    () => buildDdayList(departures, incentives, quotes),
    [departures, incentives, quotes],
  );

  // ── 견적번호 → 견적 맵 (인센 모달 quoteInfo 용) ──
  const quoteMap = useMemo(() => {
    const m = new Map();
    for (const q of quotes) if (q.견적번호) m.set(q.견적번호, q);
    return m;
  }, [quotes]);

  // ── 이벤트 클릭 핸들러 ──
  const handleEventClick = useCallback((evt) => {
    if (evt.type === 'incentive') {
      setSelectedIncent(evt.record);
    } else {
      setSelectedQuote(evt.record);
    }
  }, []);

  // ── 달력 셀 렌더러 (events 맵 사전 계산 + 안정적 핸들러 참조) ──
  const cellRender = useCallback((date, info) => {
    if (info.type !== 'date') return info.originNode;
    const dateStr = date.format('YYYY-MM-DD');
    const dayEvents = events.get(dateStr);
    if (!dayEvents || dayEvents.length === 0) return info.originNode;

    return (
      <div style={{ position: 'relative' }}>
        {info.originNode}
        <div style={{ marginTop: 2, maxHeight: 54, overflow: 'hidden' }}>
          {dayEvents.slice(0, 3).map((evt, i) => (
            <EventBadge key={i} evt={evt} onClick={handleEventClick} />
          ))}
          {dayEvents.length > 3 && (
            <Typography.Text type="secondary" style={{ fontSize: 10, paddingLeft: 4 }}>
              +{dayEvents.length - 3}건 더
            </Typography.Text>
          )}
        </div>
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // ── 날짜 선택 ──
  const handleDateSelect = useCallback((date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayEvents = events.get(dateStr);
    if (dayEvents && dayEvents.length > 0) {
      setDrawerDate(date);
    }
  }, [events]);

  // ── D-day 아이템 클릭 ──
  const handleDdayClick = useCallback((item) => {
    if (item.matchedInc) {
      setSelectedIncent(item.matchedInc);
    } else if (item.matchedQuote) {
      setSelectedQuote(item.matchedQuote);
    }
  }, []);

  // ── 인센 저장 ──
  const handleIncentSave = useCallback((updated) => {
    onUpdateIncentive?.(updated);
    setSelectedIncent(null);
    message.success('인센티브 정보가 저장되었습니다.');
  }, [onUpdateIncentive, message]);

  // ── 렌더 ──
  return (
    <div style={{ padding: 24 }}>

      {/* ── 헤더 ── */}
      <Space style={{ marginBottom: 16 }}>
        <ScheduleOutlined style={{ fontSize: 20, color: '#13c2c2' }} />
        <Typography.Title level={4} style={{ margin: 0 }}>출발 달력</Typography.Title>
        <Space size={12}>
          <Space size={4}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: '#e6f4ff', border: '1px solid #91caff', borderRadius: 2 }} />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>견적 체결</Typography.Text>
          </Space>
          <Space size={4}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 2 }} />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>정산 완료</Typography.Text>
          </Space>
          <Space size={4}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: '#fff', border: '2px solid #ff4d4f', borderRadius: 2 }} />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>D-7 이내</Typography.Text>
          </Space>
        </Space>
      </Space>

      <Row gutter={24}>
        {/* ── 달력 ── */}
        <Col xs={24} lg={17}>
          <Card
            size="small"
            style={{ borderRadius: 10, borderColor: '#dde8f5' }}
            styles={{ body: { padding: '8px 12px' } }}
          >
            <Calendar
              fullCellRender={cellRender}
              onSelect={handleDateSelect}
            />
          </Card>
        </Col>

        {/* ── D-day 사이드 패널 ── */}
        <Col xs={24} lg={7}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              borderColor: ddayList.length > 0 ? '#ffccc7' : '#dde8f5',
              position: 'sticky',
              top: 140,
            }}
            title={
              <Space>
                <ClockCircleOutlined style={{ color: ddayList.length > 0 ? '#ff4d4f' : '#8a9bb0' }} />
                <span style={{ fontWeight: 600 }}>D-7 이내 출발</span>
                {ddayList.length > 0 && (
                  <Badge count={ddayList.length} style={{ backgroundColor: '#ff4d4f' }} />
                )}
              </Space>
            }
          >
            {ddayList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <ClockCircleOutlined style={{ fontSize: 32, color: '#d9d9d9', marginBottom: 8 }} />
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  7일 이내 출발 예정 건이 없습니다
                </Typography.Text>
              </div>
            ) : (
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                {ddayList.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => handleDdayClick(item)}
                    style={{
                      padding: '10px 12px',
                      borderBottom: i < ddayList.length - 1 ? '1px solid #f5f5f5' : undefined,
                      cursor: item.matchedInc || item.matchedQuote ? 'pointer' : 'default',
                      borderRadius: 6,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fff1f0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Typography.Text strong style={{ fontSize: 13 }}>
                        {item.대리점명}
                      </Typography.Text>
                      <Tag
                        color={item.dday === 0 ? 'error' : item.dday <= 3 ? 'warning' : 'default'}
                        style={{ margin: 0, fontWeight: 700, fontSize: 12 }}
                      >
                        {item.dday === 0 ? 'TODAY' : `D-${item.dday}`}
                      </Tag>
                    </div>
                    <Space size={8}>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {item.출발일}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {item.인원}명
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {item.상품코드}
                      </Typography.Text>
                    </Space>
                    {item.matchedInc && (
                      <Tag color="success" style={{ fontSize: 10, marginTop: 4 }}>정산 완료</Tag>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── 날짜 클릭 Drawer ── */}
      <DateDrawer
        open={!!drawerDate}
        date={drawerDate}
        events={events}
        onClose={() => setDrawerDate(null)}
        onClickEvent={(evt) => {
          setDrawerDate(null);
          setTimeout(() => handleEventClick(evt), 100);
        }}
      />

      {/* ── 인센 상세 모달 ── */}
      <IncentiveDetailModal
        open={!!selectedIncent}
        record={selectedIncent}
        quoteInfo={selectedIncent ? quoteMap.get(selectedIncent.온라인견적번호) ?? null : null}
        onSave={handleIncentSave}
        onCancel={() => setSelectedIncent(null)}
      />

      {/* ── 견적 미니 Drawer ── */}
      <QuoteMiniModal
        open={!!selectedQuote}
        quote={selectedQuote}
        onClose={() => setSelectedQuote(null)}
      />
    </div>
  );
}
