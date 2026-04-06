'use client';

/**
 * components/tabs/IncentiveTab.jsx
 * 인센티브 정산 탭 — 두 엑셀 파일(인센정리 + 분기별 단가)을 통합 관리하는 핵심 뷰
 */

import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Typography,
  Table,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Modal,
  Descriptions,
  InputNumber,
  Divider,
  Tooltip,
  Popconfirm,
  App,
} from 'antd';
import {
  DollarOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
  TeamOutlined,
  BarChartOutlined,
  EditOutlined,
  SaveOutlined,
  FileTextOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { formatKRW, calcIncentiveSummary, getQuarterRange } from '@/lib/store';
import IncentiveDetailModal from '@/components/IncentiveDetailModal';

const { RangePicker } = DatePicker;

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const OX_COLOR  = { O: 'success', X: 'error' };
const OX_TEXT   = { O: '완료', X: '미완료' };
const STATUS_COLOR = { 체결: 'success', 미체결: 'error' };

const COST_ITEMS = ['항공', '지상', '공동경비', '넷가', '수익', '입금가'];

// ─────────────────────────────────────────────
// 요약 카드
// ─────────────────────────────────────────────

function SummaryCard({ icon, label, value, sub, color = '#0054A6' }) {
  return (
    <Card
      size="small"
      style={{ borderColor: '#dde8f5', borderRadius: 10, height: '100%' }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 10,
            background: `${color}14`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color, flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{label}</Typography.Text>
          <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.3 }}>{value}</div>
          {sub && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>{sub}</Typography.Text>
          )}
        </div>
      </div>
    </Card>
  );
}

// IncentiveDetailModal은 @/components/IncentiveDetailModal.jsx로 추출됨

function OxTag({ value }) {
  return <Tag color={OX_COLOR[value] ?? 'default'}>{OX_TEXT[value] ?? value ?? '—'}</Tag>;
}

// ─────────────────────────────────────────────
// 메인 테이블 컬럼
// ─────────────────────────────────────────────

function getColumns() {
  return [
    {
      title: '대리점명',
      dataIndex: '대리점명',
      ellipsis: true,
      width: 130,
      render: (v) => <Typography.Text strong>{v}</Typography.Text>,
    },
    {
      title: '지역',
      dataIndex: '지역',
      width: 70,
      filters: [],  // 동적으로 설정
      onFilter: (val, r) => r.지역 === val,
    },
    {
      title: '출발일',
      dataIndex: '출발일',
      width: 100,
      sorter: (a, b) => (a.출발일 || '').localeCompare(b.출발일 || ''),
      render: (v) => {
        if (!v) return '—';
        const diff = dayjs(v).diff(dayjs(), 'day');
        return (
          <Space size={4}>
            <span>{v}</span>
            {diff >= 0 && diff <= 7 && (
              <Tag color="error" style={{ marginRight: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                D-{diff}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '인원',
      dataIndex: '인원수',
      width: 60,
      align: 'right',
      sorter: (a, b) => (a.인원수 || 0) - (b.인원수 || 0),
      render: (v) => v ? `${v}명` : '—',
    },
    {
      title: '총매출액',
      dataIndex: '총매출액',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.총매출액 || 0) - (b.총매출액 || 0),
      render: (v) => v > 0
        ? <Typography.Text style={{ color: '#0054A6', fontWeight: 600 }}>{formatKRW(v)}</Typography.Text>
        : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: '수익',
      dataIndex: '하나투어수익',
      width: 110,
      align: 'right',
      sorter: (a, b) => (a.하나투어수익 || 0) - (b.하나투어수익 || 0),
      render: (v) => v > 0
        ? <Typography.Text style={{ color: '#722ed1', fontWeight: 600 }}>{formatKRW(v)}</Typography.Text>
        : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: '입금가',
      dataIndex: '최종입금가',
      width: 110,
      align: 'right',
      render: (v) => v > 0 ? formatKRW(v) : '—',
    },
    {
      title: '넷가',
      dataIndex: '최종넷가',
      width: 100,
      align: 'right',
      render: (v) => v > 0 ? formatKRW(v) : '—',
    },
    {
      title: '발권',
      dataIndex: '발권여부',
      width: 60,
      align: 'center',
      render: (v) => <OxTag value={v} />,
    },
    {
      title: '입금',
      dataIndex: '입금완료',
      width: 60,
      align: 'center',
      render: (v) => <OxTag value={v} />,
    },
    {
      title: '상태',
      dataIndex: '체결여부',
      width: 70,
      align: 'center',
      render: (v) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{v || '—'}</Tag>
      ),
    },
  ];
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function IncentiveTab({
  incentives = [],
  quarterly = {},
  quotes = [],
  departures = [],
  onUpdateIncentive,
  onDeleteIncentive,
  isAdmin,
}) {
  const { message } = App.useApp();

  // ── 필터 상태 ──
  const [filterRegion, setFilterRegion]   = useState(null);
  const [filterStatus, setFilterStatus]   = useState(null);
  const [filterTicket, setFilterTicket]   = useState(null);
  const [filterDates, setFilterDates]     = useState(null);
  const [filterQuarter, setFilterQuarter] = useState(null);

  // ── 모달 상태 ──
  const [selected, setSelected] = useState(null);

  // ── 견적번호 → 견적 정보 맵 (JOIN) ──
  const quoteMap = useMemo(() => {
    const m = new Map();
    for (const q of quotes) {
      if (q.견적번호) m.set(q.견적번호, q);
    }
    return m;
  }, [quotes]);

  // ── 지역 목록 추출 ──
  const regionOptions = useMemo(() => {
    const set = new Set(incentives.map((i) => i.지역).filter(Boolean));
    return Array.from(set).sort().map((v) => ({ value: v, label: v }));
  }, [incentives]);

  // ── 필터링 ──
  const filteredData = useMemo(() => {
    let data = [...incentives];
    if (filterRegion) data = data.filter((r) => r.지역 === filterRegion);
    if (filterStatus) data = data.filter((r) => r.체결여부 === filterStatus);
    if (filterTicket != null) data = data.filter((r) => r.발권여부 === filterTicket);
    if (filterDates?.[0] && filterDates?.[1]) {
      const [s, e] = filterDates;
      data = data.filter((r) => {
        if (!r.출발일) return false;
        const d = dayjs(r.출발일);
        return d.isValid() && !d.isBefore(s, 'day') && !d.isAfter(e, 'day');
      });
    }
    if (filterQuarter) {
      const qr = getQuarterRange(filterQuarter);
      if (qr) {
        data = data.filter((r) => r.출발일 && r.출발일 >= qr.start && r.출발일 <= qr.end);
      }
    }
    return data;
  }, [incentives, filterRegion, filterStatus, filterTicket, filterDates, filterQuarter]);

  // ── 요약 집계 ──
  const summaryStats = useMemo(() => {
    const settled = filteredData.filter((r) => r.체결여부 === '체결');
    const totalRev = settled.reduce((s, r) => s + (r.총매출액 || 0), 0);
    const totalProfit = settled.reduce((s, r) => s + (r.하나투어수익 || 0), 0);
    const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 10000) / 100 : 0;

    // D-day 7일 이내
    const dday7 = filteredData.filter((r) => {
      if (!r.출발일) return false;
      const diff = dayjs(r.출발일).diff(dayjs(), 'day');
      return diff >= 0 && diff <= 7;
    }).length;

    return { totalRev, totalProfit, avgMargin, settledCount: settled.length, dday7 };
  }, [filteredData]);

  // ── 핸들러 ──
  const handleRowClick = useCallback((record) => {
    setSelected(record);
  }, []);

  const handleDelete = useCallback((quoteId) => {
    onDeleteIncentive?.(quoteId);
    setSelected(null);
    message.success('인센티브가 삭제되었습니다.');
  }, [onDeleteIncentive, message]);

  // ── 컬럼 (지역 필터 옵션 동적 주입 + 삭제 컬럼) ──
  const columns = useMemo(() => {
    const cols = getColumns();
    const regionCol = cols.find((c) => c.dataIndex === '지역');
    if (regionCol) {
      regionCol.filters = regionOptions.map((r) => ({ text: r.label, value: r.value }));
    }
    if (isAdmin) {
      cols.push({
        title: '',
        width: 40,
        align: 'center',
        render: (_, r) => (
          <Popconfirm
            title="인센티브 삭제"
            onConfirm={(e) => { e?.stopPropagation(); handleDelete(r.온라인견적번호); }}
            onCancel={(e) => e?.stopPropagation()}
            okText="삭제" cancelText="취소" okType="danger"
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        ),
      });
    }
    return cols;
  }, [regionOptions, handleDelete, isAdmin]);

  const handleSave = useCallback((updated) => {
    onUpdateIncentive?.(updated);
    setSelected(null);
    message.success('인센티브 정보가 저장되었습니다.');
  }, [onUpdateIncentive, message]);

  const clearFilters = () => {
    setFilterRegion(null);
    setFilterStatus(null);
    setFilterTicket(null);
    setFilterDates(null);
    setFilterQuarter(null);
  };

  const hasFilter = filterRegion || filterStatus || filterTicket != null || filterDates || filterQuarter;

  // ── 렌더 ──
  return (
    <div style={{ padding: '24px' }}>

      {/* ── 요약 카드 ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard
            icon={<DollarOutlined />}
            label="총 매출 합계 (체결)"
            value={formatKRW(summaryStats.totalRev)}
            sub={`체결 ${summaryStats.settledCount}건`}
            color="#0054A6"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard
            icon={<BarChartOutlined />}
            label="하나투어 수익 합계"
            value={formatKRW(summaryStats.totalProfit)}
            color="#722ed1"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard
            icon={<BarChartOutlined />}
            label="평균 마진율"
            value={`${summaryStats.avgMargin}%`}
            sub={summaryStats.avgMargin >= 8 ? '양호' : '점검 필요'}
            color="#fa8c16"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard
            icon={<CalendarOutlined />}
            label="D-7 이내 출발"
            value={summaryStats.dday7}
            sub={summaryStats.dday7 > 0 ? '긴급 확인 필요' : '해당 없음'}
            color={summaryStats.dday7 > 0 ? '#ff4d4f' : '#52c41a'}
          />
        </Col>
      </Row>

      {/* ── 필터 바 ── */}
      <Card
        size="small"
        style={{ marginBottom: 16, borderRadius: 10, borderColor: '#dde8f5' }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space wrap size={12} style={{ width: '100%' }}>
          <Space size={4}>
            <GlobalOutlined style={{ color: '#722ed1' }} />
            <Select
              placeholder="지역"
              allowClear
              value={filterRegion}
              onChange={setFilterRegion}
              options={regionOptions}
              style={{ width: 120 }}
              size="small"
            />
          </Space>

          <Select
            placeholder="체결 상태"
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: '체결', label: '체결' },
              { value: '미체결', label: '미체결' },
            ]}
            style={{ width: 110 }}
            size="small"
          />

          <Select
            placeholder="발권 여부"
            allowClear
            value={filterTicket}
            onChange={setFilterTicket}
            options={[
              { value: 'O', label: '발권 완료' },
              { value: 'X', label: '발권 미완료' },
            ]}
            style={{ width: 130 }}
            size="small"
          />

          <Select
            placeholder="출발 분기"
            allowClear
            value={filterQuarter}
            onChange={setFilterQuarter}
            options={[
              { value: 1, label: '1분기 (1~3월)' },
              { value: 2, label: '2분기 (4~6월)' },
              { value: 3, label: '3분기 (7~9월)' },
              { value: 4, label: '4분기 (10~12월)' },
            ]}
            style={{ width: 140 }}
            size="small"
          />

          <RangePicker
            size="small"
            placeholder={['출발일 시작', '출발일 끝']}
            value={filterDates}
            onChange={setFilterDates}
            style={{ width: 240 }}
          />

          {hasFilter && (
            <Button size="small" onClick={clearFilters} type="link" danger>
              필터 초기화
            </Button>
          )}

          <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
            {filteredData.length.toLocaleString()}건
            {filteredData.length !== incentives.length && ` / 전체 ${incentives.length}`}
          </Typography.Text>
        </Space>
      </Card>

      {/* ── 메인 테이블 ── */}
      <Card
        size="small"
        style={{ borderRadius: 10, borderColor: '#dde8f5' }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          size="small"
          columns={columns}
          dataSource={filteredData}
          rowKey={(r) => r.온라인견적번호 || `${r.대리점명}__${r.출발일}`}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `${t}건` }}
          scroll={{ x: 1060 }}
          locale={{ emptyText: '인센티브 데이터가 없습니다. 데이터 임포트 탭에서 파일을 업로드하세요.' }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
          rowClassName={(r) => r.체결여부 === '체결' ? 'incentive-settled-row' : ''}
        />
      </Card>

      {/* ── 상세 모달 ── */}
      <IncentiveDetailModal
        open={!!selected}
        record={selected}
        quoteInfo={selected ? quoteMap.get(selected.온라인견적번호) ?? null : null}
        onSave={handleSave}
        onDelete={isAdmin ? handleDelete : undefined}
        onCancel={() => setSelected(null)}
      />

      {/* 체결 행 하이라이트 */}
      <style jsx global>{`
        .incentive-settled-row td {
          background: #faf5ff !important;
        }
        .incentive-settled-row:hover td {
          background: #f0e6ff !important;
        }
      `}</style>
    </div>
  );
}
