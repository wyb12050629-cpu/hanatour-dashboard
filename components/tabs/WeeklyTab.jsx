'use client';

/**
 * components/tabs/WeeklyTab.jsx
 * 주간 보고 탭 — 주차 선택 + 집계 + 대리점명 lookup + 클립보드 복사
 */

import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Typography, Card, Row, Col, Table, Tag, Space,
  Button, Tooltip, App, Select,
} from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, TeamOutlined,
  DollarOutlined, CopyOutlined, SafetyCertificateOutlined,
  ShopOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { getCurrentWeekRange, generateWeekOptions, formatKRW } from '@/lib/store';

// ─────────────────────────────────────────────
// 주차 옵션 (모듈 레벨 캐시 — 연도 변경 시만 재생성)
// ─────────────────────────────────────────────

const THIS_YEAR = dayjs().year();
const WEEK_OPTIONS = generateWeekOptions(THIS_YEAR);
const CURRENT_WED = getCurrentWeekRange().start.format('YYYY-MM-DD');

// ─────────────────────────────────────────────
// 집계 훅
// ─────────────────────────────────────────────

function useWeeklySummary(dailyLogs, agencies, selectedWeek) {
  // 대리점코드 → 대리점명 lookup 맵
  const agencyNameMap = useMemo(() => {
    const m = new Map();
    for (const a of agencies) {
      if (a.대리점코드) m.set(a.대리점코드, a.대리점명 || a.대리점코드);
    }
    return m;
  }, [agencies]);

  return useMemo(() => {
    // 선택된 주차의 start/end 계산
    const weekOpt = WEEK_OPTIONS.find((w) => w.value === selectedWeek);
    const start = weekOpt?.start ?? getCurrentWeekRange().start;
    const end = weekOpt?.end ?? getCurrentWeekRange().end;
    const wedStr = start.format('YYYY-MM-DD');

    // ── 이번 주 로그 필터 ──
    const weekLogs = dailyLogs.filter((log) => {
      if (log.주차) return log.주차 === wedStr;
      if (log.날짜) {
        const d = dayjs(log.날짜);
        return d.isValid() && !d.isBefore(start, 'day') && !d.isAfter(end, 'day');
      }
      return false;
    });

    // ── 전체 집계 ──
    const inboundLogs = weekLogs.filter((r) => r.견적인입여부 === 1);
    const settledLogs = weekLogs.filter((r) => r.체결여부 === 1);
    const stats = {
      인입건수: inboundLogs.length,
      체결건수: settledLogs.length,
      예약인원: settledLogs.reduce((s, r) => s + (r.인원 || 0), 0),
      매출합계: settledLogs.reduce((s, r) => s + (r.매출 || 0), 0),
    };

    // ── 보고구분별 분리 집계 ──
    const splitByType = (type) => {
      const subset = weekLogs.filter((r) => r.보고구분 === type);
      const inb = subset.filter((r) => r.견적인입여부 === 1).length;
      const stl = subset.filter((r) => r.체결여부 === 1).length;
      return { 인입: inb, 체결: stl, 체결률: inb > 0 ? Math.round((stl / inb) * 100) : 0 };
    };

    // ── 대리점별 테이블 데이터 (대리점명 lookup 적용) ──
    const rowMap = new Map();
    for (const log of weekLogs) {
      // 대리점명 결정: Daily_Log의 대리점명(입력) 우선, 없으면 agencies에서 lookup
      const name = log.대리점명 || agencyNameMap.get(log.대리점코드) || log.대리점코드 || '(미상)';
      const key = log.대리점코드 || name;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          _key: key,
          대리점명: name,
          보고구분: log.보고구분 || '',
          견적인입: 0,
          체결: 0,
          예약인원: 0,
          매출액: 0,
        });
      }
      const row = rowMap.get(key);
      // 같은 대리점인데 더 나은 이름이 있으면 업데이트
      if (log.대리점명 && row.대리점명 !== log.대리점명) {
        row.대리점명 = log.대리점명;
      }
      if (log.견적인입여부 === 1) row.견적인입 += 1;
      if (log.체결여부 === 1) {
        row.체결 += 1;
        row.예약인원 += log.인원 || 0;
        row.매출액 += log.매출 || 0;
      }
    }
    const agencyRows = Array.from(rowMap.values()).sort(
      (a, b) => b.매출액 - a.매출액 || b.체결 - a.체결,
    );

    return {
      start, end, weekLogs, ...stats,
      공식인증: splitByType('공식인증'),
      일반대리점: splitByType('일반대리점'),
      agencyRows,
    };
  }, [dailyLogs, agencyNameMap, selectedWeek]);
}

// ─────────────────────────────────────────────
// KPI 카드
// ─────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color = '#0054A6', suffix = '' }) {
  return (
    <Card size="small" style={{ borderColor: '#dde8f5', borderRadius: 10, height: '100%' }}
      styles={{ body: { padding: '18px 20px' } }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: `${color}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color, flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{label}</Typography.Text>
          <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.2 }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2 }}>{suffix}</span>}
          </div>
          {sub != null && <Typography.Text type="secondary" style={{ fontSize: 11 }}>{sub}</Typography.Text>}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// 공식인증 / 일반대리점 분리 카드
// ─────────────────────────────────────────────

function TypeSplitCard({ icon, label, color, data }) {
  return (
    <Card size="small" style={{ borderColor: '#dde8f5', borderRadius: 10, height: '100%', borderLeft: `4px solid ${color}` }}
      styles={{ body: { padding: '18px 20px' } }}>
      <Space style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 18, color }}>{icon}</span>
        <Typography.Text strong style={{ fontSize: 14 }}>{label}</Typography.Text>
      </Space>
      <Row gutter={16}>
        {[
          { val: data.인입, label: '인입', color: '#0054A6' },
          { val: data.체결, label: '체결', color: '#52c41a' },
          { val: `${data.체결률}%`, label: '체결률', color: '#fa8c16' },
        ].map(({ val, label: lbl, color: c }) => (
          <Col span={8} key={lbl} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{val}</div>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>{lbl}</Typography.Text>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

// ─────────────────────────────────────────────
// 테이블 컬럼 (업무건수 제거됨)
// ─────────────────────────────────────────────

const TABLE_COLUMNS = [
  {
    title: '대리점명',
    dataIndex: '대리점명',
    ellipsis: true,
    render: (v, row) => (
      <Typography.Text strong={row.체결 > 0} style={row.체결 > 0 ? { color: '#1d8348' } : undefined}>
        {v}
      </Typography.Text>
    ),
  },
  {
    title: '보고구분',
    dataIndex: '보고구분',
    width: 100,
    render: (v) => <Tag color={v === '공식인증' ? 'blue' : 'default'}>{v || '—'}</Tag>,
  },
  {
    title: '견적인입',
    dataIndex: '견적인입',
    width: 85,
    align: 'center',
    sorter: (a, b) => a.견적인입 - b.견적인입,
    render: (v) => v > 0
      ? <Typography.Text style={{ color: '#0054A6', fontWeight: 600 }}>{v}</Typography.Text>
      : <Typography.Text type="secondary">0</Typography.Text>,
  },
  {
    title: '체결',
    dataIndex: '체결',
    width: 70,
    align: 'center',
    sorter: (a, b) => a.체결 - b.체결,
    render: (v) => v > 0
      ? <Tag color="success" style={{ fontWeight: 700 }}>{v}</Tag>
      : <Typography.Text type="secondary">0</Typography.Text>,
  },
  {
    title: '예약인원',
    dataIndex: '예약인원',
    width: 90,
    align: 'right',
    sorter: (a, b) => a.예약인원 - b.예약인원,
    render: (v) => v > 0
      ? <Typography.Text strong style={{ color: '#1d8348' }}>{v.toLocaleString()}명</Typography.Text>
      : <Typography.Text type="secondary">—</Typography.Text>,
  },
  {
    title: '매출액',
    dataIndex: '매출액',
    width: 130,
    align: 'right',
    sorter: (a, b) => a.매출액 - b.매출액,
    defaultSortOrder: 'descend',
    render: (v) => v > 0
      ? <Typography.Text strong style={{ color: '#0054A6' }}>{formatKRW(v)}</Typography.Text>
      : <Typography.Text type="secondary">—</Typography.Text>,
  },
];

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function WeeklyTab({ agencies = [], quotes = [], dailyLogs = [] }) {
  const [selectedWeek, setSelectedWeek] = useState(CURRENT_WED);
  const { message } = App.useApp();

  const {
    start, end, weekLogs,
    인입건수, 체결건수, 예약인원, 매출합계,
    공식인증, 일반대리점, agencyRows,
  } = useWeeklySummary(dailyLogs, agencies, selectedWeek);

  const rangeLabel = `${start.format('MM.DD')}(수) ~ ${end.format('MM.DD')}(화)`;
  const rangeFull = `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`;

  // ── 주차 Select 옵션 (antd Select용) ──
  const weekSelectOptions = useMemo(
    () => WEEK_OPTIONS.map((w) => ({ value: w.value, label: w.label })),
    [],
  );

  // ── 클립보드 복사 ──
  const handleCopyReport = useCallback(() => {
    const lines = [
      `[주간 영업 보고 - ${rangeFull}]`,
      `■ 공식인증: 인입 ${공식인증.인입}건 / 체결 ${공식인증.체결}건`,
      `■ 일반대리점: 인입 ${일반대리점.인입}건 / 체결 ${일반대리점.체결}건`,
      `■ 총 예약인원: ${예약인원.toLocaleString()}명`,
      `■ 총 매출: ${formatKRW(매출합계)}`,
    ];
    if (agencyRows.length > 0) {
      lines.push('');
      lines.push('[대리점별 실적]');
      for (const r of agencyRows) {
        const parts = [`${r.대리점명}(${r.보고구분})`];
        if (r.견적인입 > 0) parts.push(`인입 ${r.견적인입}`);
        if (r.체결 > 0) parts.push(`체결 ${r.체결}`);
        if (r.예약인원 > 0) parts.push(`${r.예약인원}명`);
        if (r.매출액 > 0) parts.push(formatKRW(r.매출액));
        lines.push(`  - ${parts.join(' / ')}`);
      }
    }
    navigator.clipboard.writeText(lines.join('\n')).then(
      () => message.success('주간 보고서가 클립보드에 복사되었습니다.'),
      () => message.error('복사에 실패했습니다.'),
    );
  }, [rangeFull, 공식인증, 일반대리점, 예약인원, 매출합계, agencyRows, message]);

  return (
    <div style={{ padding: '24px' }}>

      {/* ── 헤더: 주차 선택 + 범위 + 복사 버튼 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Space wrap>
          <CalendarOutlined style={{ fontSize: 20, color: '#0054A6' }} />
          <Typography.Title level={4} style={{ margin: 0 }}>주간 보고</Typography.Title>
          <Select
            value={selectedWeek}
            onChange={setSelectedWeek}
            options={weekSelectOptions}
            style={{ width: 260 }}
            showSearch
            optionFilterProp="label"
            placeholder="주차 선택"
          />
          <Tag color="blue" variant="filled" style={{ fontSize: 13, padding: '2px 10px' }}>
            {rangeLabel}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Daily Log {weekLogs.length}건
          </Typography.Text>
        </Space>
        <Tooltip title="보고서 텍스트를 클립보드에 복사합니다">
          <Button icon={<CopyOutlined />} onClick={handleCopyReport}
            style={{ borderColor: '#0054A6', color: '#0054A6' }}>
            클립보드에 복사
          </Button>
        </Tooltip>
      </div>

      {/* ── 상단 통계 카드 4개 ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon={<FileTextOutlined />} label="견적 인입" value={인입건수} suffix="건" color="#0054A6" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon={<CheckCircleOutlined />} label="체결" value={체결건수} suffix="건" color="#52c41a"
            sub={인입건수 > 0 ? `체결률 ${Math.round((체결건수 / 인입건수) * 100)}%` : undefined} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon={<TeamOutlined />} label="예약 인원" value={예약인원} suffix="명" color="#1677ff" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon={<DollarOutlined />} label="매출" value={formatKRW(매출합계)} color="#fa8c16" />
        </Col>
      </Row>

      {/* ── 공식인증 vs 일반대리점 ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <TypeSplitCard icon={<SafetyCertificateOutlined />} label="공식인증" color="#0054A6" data={공식인증} />
        </Col>
        <Col xs={24} md={12}>
          <TypeSplitCard icon={<ShopOutlined />} label="일반대리점" color="#8a9bb0" data={일반대리점} />
        </Col>
      </Row>

      {/* ── 대리점별 실적 테이블 ── */}
      <Card size="small"
        title={
          <Space>
            <TeamOutlined style={{ color: '#0054A6' }} />
            <span style={{ fontWeight: 600 }}>대리점별 실적</span>
            <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              {rangeLabel} · 매출 순
            </Typography.Text>
          </Space>
        }
        style={{ borderColor: '#dde8f5', borderRadius: 10 }}
        styles={{ body: { padding: 0 } }}>
        <Table
          size="small"
          columns={TABLE_COLUMNS}
          dataSource={agencyRows}
          rowKey="_key"
          pagination={false}
          scroll={{ x: 560 }}
          locale={{ emptyText: '선택한 주차에 해당하는 Daily Log가 없습니다.' }}
          rowClassName={(row) => (row.체결 > 0 ? 'weekly-settled-row' : '')}
        />
      </Card>

      <style jsx global>{`
        .weekly-settled-row td { background: #f6ffed !important; }
        .weekly-settled-row:hover td { background: #d9f7be !important; }
      `}</style>
    </div>
  );
}
