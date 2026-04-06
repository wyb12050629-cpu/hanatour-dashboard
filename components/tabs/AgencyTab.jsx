'use client';

/**
 * components/tabs/AgencyTab.jsx
 * 대리점 관리 탭 — CRUD 전체 지원, EditAgencyModal, 상세 패널
 */

import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Typography, Table, Tag, Space, Card, Input, Row, Col,
  Tabs, Timeline, Empty, Button, Popconfirm, Modal, Select,
  DatePicker, App,
} from 'antd';
import {
  TeamOutlined, SearchOutlined, FileTextOutlined, BarChartOutlined,
  EditOutlined, DeleteOutlined, PlusOutlined,
} from '@ant-design/icons';
import { getCurrentWeekRange, formatKRW } from '@/lib/store';

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const ACTION_OPTIONS = [
  '신규연락', '방문예정', '상품제안', '견적전달',
  '인센제안', '오버컴제안', '전화팔로업', '반응확인',
].map((v) => ({ value: v, label: v }));

const GRADE_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

const REPORT_OPTIONS = [
  { value: '공식인증', label: '공식인증' },
  { value: '일반대리점', label: '일반대리점' },
];

const TYPE_OPTIONS = [
  { value: '공식인증예약센터', label: '공식인증예약센터' },
  { value: '일반대리점', label: '일반대리점' },
];

const INTERNAL_GRADE_OPTIONS = [
  '1등급', '2등급', '3등급', '4등급', '5등급',
].map((v) => ({ value: v, label: v }));

// ─────────────────────────────────────────────
// EditAgencyModal
// ─────────────────────────────────────────────

function EditAgencyModal({ open, agency, isNew, onSave, onCancel }) {
  const [form, setForm] = useState({});
  const { message } = App.useApp();

  // agency가 바뀔 때 폼 리셋
  const current = useMemo(() => {
    if (!open) return {};
    return isNew
      ? { 대리점코드: '', 대리점명: '', 대리점유형: '', 점형태: '', 내부등급: '',
          팀: '', 부서: '', 담당자: '', 보고구분: '일반대리점', 관리등급: 'C',
          특징: '', 다음액션: '', 최근접촉일: '', 메모: '', ...form }
      : { ...agency, ...form };
  }, [open, agency, isNew, form]);

  const patch = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!current.대리점코드?.trim()) {
      message.warning('대리점코드를 입력하세요.');
      return;
    }
    if (!current.대리점명?.trim()) {
      message.warning('대리점명을 입력하세요.');
      return;
    }
    onSave?.(current);
    setForm({});
  };

  const handleCancel = () => {
    setForm({});
    onCancel?.();
  };

  const fieldStyle = { marginBottom: 12 };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      width={680}
      centered
      destroyOnHidden
      title={
        <Space>
          <TeamOutlined style={{ color: '#0054A6' }} />
          <span>{isNew ? '신규 대리점 추가' : '대리점 정보 수정'}</span>
          {!isNew && <Typography.Text code style={{ fontSize: 12 }}>{agency?.대리점코드}</Typography.Text>}
        </Space>
      }
      footer={[
        <Button key="cancel" onClick={handleCancel}>취소</Button>,
        <Button key="save" type="primary" onClick={handleSave} style={{ background: '#0054A6' }}>
          {isNew ? '추가' : '저장'}
        </Button>,
      ]}
    >
      <Row gutter={16}>
        {/* 대리점코드 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>대리점코드 {!isNew && <Tag style={{ fontSize: 10 }}>PK</Tag>}</span>
            <Input size="small" value={current.대리점코드 || ''}
              onChange={(e) => patch('대리점코드', e.target.value)}
              disabled={!isNew} placeholder="예: AG005" />
          </div>
        </Col>
        {/* 대리점명 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>대리점명</span>
            <Input size="small" value={current.대리점명 || ''}
              onChange={(e) => patch('대리점명', e.target.value)} />
          </div>
        </Col>
        {/* 대리점유형 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>대리점유형</span>
            <Select size="small" value={current.대리점유형 || undefined}
              onChange={(v) => patch('대리점유형', v)}
              options={TYPE_OPTIONS} style={{ width: '100%' }} allowClear placeholder="선택" />
          </div>
        </Col>
        {/* 보고구분 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>보고구분</span>
            <Select size="small" value={current.보고구분 || undefined}
              onChange={(v) => patch('보고구분', v)}
              options={REPORT_OPTIONS} style={{ width: '100%' }} />
          </div>
        </Col>
        {/* 관리등급 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>관리등급</span>
            <Select size="small" value={current.관리등급 || undefined}
              onChange={(v) => patch('관리등급', v)}
              options={GRADE_OPTIONS} style={{ width: '100%' }} />
          </div>
        </Col>
        {/* 내부등급 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>내부등급</span>
            <Select size="small" value={current.내부등급 || undefined}
              onChange={(v) => patch('내부등급', v)}
              options={INTERNAL_GRADE_OPTIONS} style={{ width: '100%' }} allowClear placeholder="선택" />
          </div>
        </Col>
        {/* 점형태 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>점형태</span>
            <Input size="small" value={current.점형태 || ''}
              onChange={(e) => patch('점형태', e.target.value)} placeholder="법인/개인" />
          </div>
        </Col>
        {/* 팀 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>팀</span>
            <Input size="small" value={current.팀 || ''}
              onChange={(e) => patch('팀', e.target.value)} />
          </div>
        </Col>
        {/* 부서 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>부서</span>
            <Input size="small" value={current.부서 || ''}
              onChange={(e) => patch('부서', e.target.value)} />
          </div>
        </Col>
        {/* 담당자 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>담당자</span>
            <Input size="small" value={current.담당자 || ''}
              onChange={(e) => patch('담당자', e.target.value)} />
          </div>
        </Col>
        {/* 다음액션 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>다음액션</span>
            <Select size="small" value={current.다음액션 || undefined}
              onChange={(v) => patch('다음액션', v)}
              options={ACTION_OPTIONS} style={{ width: '100%' }} allowClear placeholder="선택" />
          </div>
        </Col>
        {/* 최근접촉일 */}
        <Col span={8}>
          <div style={fieldStyle}>
            <span style={labelStyle}>최근접촉일</span>
            <DatePicker size="small" style={{ width: '100%' }}
              value={current.최근접촉일 ? dayjs(current.최근접촉일) : null}
              onChange={(d) => patch('최근접촉일', d ? d.format('YYYY-MM-DD') : '')} />
          </div>
        </Col>
        {/* 특징 */}
        <Col span={12}>
          <div style={fieldStyle}>
            <span style={labelStyle}>특징</span>
            <Input size="small" value={current.특징 || ''}
              onChange={(e) => patch('특징', e.target.value)} />
          </div>
        </Col>
        {/* 메모 */}
        <Col span={12}>
          <div style={fieldStyle}>
            <span style={labelStyle}>메모</span>
            <Input.TextArea size="small" rows={1} value={current.메모 || ''}
              onChange={(e) => patch('메모', e.target.value)} />
          </div>
        </Col>
      </Row>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// 파생 데이터 (누적매출만 유지 — 견적/인입 컬럼 제거됨)
// ─────────────────────────────────────────────

function useDerivedData(agencies, dailyLogs) {
  return useMemo(() => {
    const revenueMap = new Map();
    for (const log of dailyLogs) {
      if (!log.대리점코드 || !log.매출) continue;
      revenueMap.set(log.대리점코드, (revenueMap.get(log.대리점코드) || 0) + log.매출);
    }
    return agencies.map((a) => ({
      ...a,
      _누적매출: revenueMap.get(a.대리점코드) || 0,
    }));
  }, [agencies, dailyLogs]);
}

// ─────────────────────────────────────────────
// 행 색상
// ─────────────────────────────────────────────

function getRowClassName(record) {
  const classes = [];
  if (record.관리등급 === 'A') classes.push('agency-grade-a');
  else if (record.관리등급 === 'B') classes.push('agency-grade-b');
  if (record.보고구분 === '공식인증') classes.push('agency-certified');
  return classes.join(' ');
}

// ─────────────────────────────────────────────
// 상세 패널 (견적/인입 컬럼 제거됨)
// ─────────────────────────────────────────────

function AgencyDetail({ agency, quotes, dailyLogs }) {
  if (!agency) return null;
  const code = agency.대리점코드;
  const agencyQuotes = quotes.filter((q) => q.대리점코드 === code);
  const agencyLogs = dailyLogs
    .filter((l) => l.대리점코드 === code)
    .sort((a, b) => (b.날짜 || '').localeCompare(a.날짜 || ''));

  const quoteColumns = [
    { title: '견적번호', dataIndex: '견적번호', width: 140, render: (v) => <Typography.Text code>{v}</Typography.Text> },
    { title: '상품코드', dataIndex: '상품코드', width: 160, ellipsis: true },
    { title: '출발일', dataIndex: '출발일', width: 100 },
    { title: '인원', dataIndex: '인원', width: 60, align: 'right', render: (v) => v ? `${v}명` : '—' },
    { title: '가격', dataIndex: '가격', width: 120, align: 'right', render: (v) => v > 0 ? formatKRW(v) : '—' },
    { title: '상태', dataIndex: '상태', width: 80,
      render: (v) => <Tag color={{ 체결: 'success', 협의중: 'processing', 미체결: 'error' }[v] ?? 'default'}>{v || '—'}</Tag> },
  ];

  return (
    <Card size="small" style={{ marginTop: 16, borderColor: '#c7d8f5', borderRadius: 10 }}
      title={
        <Space>
          <TeamOutlined style={{ color: '#0054A6' }} />
          <Typography.Text strong>{agency.대리점명}</Typography.Text>
          <Tag color={agency.보고구분 === '공식인증' ? 'blue' : 'default'}>{agency.보고구분}</Tag>
          <Tag color={{ A: 'gold', B: 'cyan', C: 'default' }[agency.관리등급] ?? 'default'}>
            {agency.관리등급 || '—'}등급
          </Tag>
        </Space>
      }>
      <Tabs size="small" items={[
        {
          key: 'quotes',
          label: <span><FileTextOutlined /> 견적 ({agencyQuotes.length})</span>,
          children: agencyQuotes.length > 0
            ? <Table size="small" columns={quoteColumns} dataSource={agencyQuotes}
                rowKey="견적번호" pagination={false} scroll={{ x: 660 }} />
            : <Empty description="등록된 견적이 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
        },
        {
          key: 'logs',
          label: <span><BarChartOutlined /> 활동 로그 ({agencyLogs.length})</span>,
          children: agencyLogs.length > 0
            ? <Timeline style={{ maxHeight: 280, overflowY: 'auto', paddingTop: 8 }}
                items={agencyLogs.slice(0, 20).map((log) => ({
                  color: log.체결여부 === 1 ? 'green' : log.견적인입여부 === 1 ? 'blue' : 'gray',
                  content: (
                    <div>
                      <Space size={8}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{log.날짜}</Typography.Text>
                        <Tag style={{ fontSize: 11 }}>{log.업무구분}</Tag>
                        {log.체결여부 === 1 && <Tag color="success" style={{ fontSize: 11 }}>체결</Tag>}
                      </Space>
                      <div style={{ fontSize: 13, marginTop: 2 }}>
                        {log.내용}
                        {log.매출 > 0 && <Typography.Text strong style={{ color: '#0054A6', marginLeft: 8 }}>{formatKRW(log.매출)}</Typography.Text>}
                      </div>
                      {log.다음액션 && <Typography.Text type="secondary" style={{ fontSize: 11 }}>{'→ '}{log.다음액션}</Typography.Text>}
                    </div>
                  ),
                }))} />
            : <Empty description="활동 로그가 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
        },
      ]} />
    </Card>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function AgencyTab({
  agencies = [],
  quotes = [],
  dailyLogs = [],
  onAddAgency,
  onUpdateAgency,
  onDeleteAgency,
}) {
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // null: 닫힘, {}: 신규, agency: 수정
  const [isNewMode, setIsNewMode] = useState(false);

  const enriched = useDerivedData(agencies, dailyLogs);

  const filtered = useMemo(() => {
    if (!search.trim()) return enriched;
    const q = search.trim().toLowerCase();
    return enriched.filter(
      (a) =>
        (a.대리점명 || '').toLowerCase().includes(q) ||
        (a.대리점코드 || '').toLowerCase().includes(q) ||
        (a.담당자 || '').toLowerCase().includes(q),
    );
  }, [enriched, search]);

  // ── 모달 핸들러 ──
  const openNewModal = useCallback(() => {
    setEditTarget({});
    setIsNewMode(true);
  }, []);

  const openEditModal = useCallback((record) => {
    setEditTarget(record);
    setIsNewMode(false);
  }, []);

  const handleModalSave = useCallback((data) => {
    if (isNewMode) {
      onAddAgency?.(data);
      message.success('대리점이 추가되었습니다.');
    } else {
      onUpdateAgency?.(data.대리점코드, data);
      message.success('대리점 정보가 저장되었습니다.');
    }
    setEditTarget(null);
  }, [isNewMode, onAddAgency, onUpdateAgency, message]);

  const handleModalCancel = useCallback(() => {
    setEditTarget(null);
  }, []);

  // ── 컬럼 (견적/인입 제거됨, 수정/삭제 추가) ──
  const columns = useMemo(() => [
    {
      title: '코드', dataIndex: '대리점코드', width: 80, fixed: 'left', ellipsis: true,
      render: (v) => <Typography.Text code style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: '대리점명', dataIndex: '대리점명', width: 140, fixed: 'left', ellipsis: true,
      render: (v, r) => (
        <Typography.Text strong style={r.보고구분 === '공식인증' ? { color: '#0054A6' } : undefined}>{v}</Typography.Text>
      ),
    },
    {
      title: '유형', dataIndex: '대리점유형', width: 80, ellipsis: true,
    },
    {
      title: '보고구분', dataIndex: '보고구분', width: 90,
      filters: [{ text: '공식인증', value: '공식인증' }, { text: '일반대리점', value: '일반대리점' }],
      onFilter: (val, r) => r.보고구분 === val,
      render: (v) => <Tag color={v === '공식인증' ? 'blue' : 'default'}>{v || '—'}</Tag>,
    },
    {
      title: '등급', dataIndex: '관리등급', width: 55, align: 'center',
      filters: GRADE_OPTIONS.map((g) => ({ text: g.value, value: g.value })),
      onFilter: (val, r) => r.관리등급 === val,
      sorter: (a, b) => (a.관리등급 || 'Z').localeCompare(b.관리등급 || 'Z'),
      render: (v) => v ? <Tag color={{ A: 'gold', B: 'cyan', C: 'default' }[v] ?? 'default'}>{v}</Tag> : '—',
    },
    { title: '팀', dataIndex: '팀', width: 80, ellipsis: true },
    { title: '담당자', dataIndex: '담당자', width: 70, ellipsis: true },
    {
      title: '접촉일', dataIndex: '최근접촉일', width: 95,
      sorter: (a, b) => (a.최근접촉일 || '').localeCompare(b.최근접촉일 || ''),
      render: (v) => {
        if (!v) return '—';
        const diff = dayjs().diff(dayjs(v), 'day');
        return (
          <Space size={4}>
            <span style={{ fontSize: 12 }}>{v}</span>
            {diff > 14 && <Tag color="warning" style={{ fontSize: 10, lineHeight: '14px', padding: '0 3px', margin: 0 }}>{diff}일</Tag>}
          </Space>
        );
      },
    },
    {
      title: '누적매출', dataIndex: '_누적매출', width: 110, align: 'right',
      sorter: (a, b) => a._누적매출 - b._누적매출, defaultSortOrder: 'descend',
      render: (v) => v > 0
        ? <Typography.Text strong style={{ color: '#0054A6' }}>{formatKRW(v)}</Typography.Text>
        : <Typography.Text type="secondary">—</Typography.Text>,
    },
    { title: '다음액션', dataIndex: '다음액션', width: 100, ellipsis: true },
    { title: '특징', dataIndex: '특징', width: 100, ellipsis: true },
    {
      title: '', width: 70, align: 'center', fixed: 'right',
      render: (_, r) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={(e) => { e.stopPropagation(); openEditModal(r); }}
            style={{ color: '#0054A6' }} />
          <Popconfirm title="대리점 삭제"
            description="이 대리점을 삭제하면 연결된 견적 데이터도 영향받을 수 있습니다. 삭제하시겠습니까?"
            onConfirm={(e) => { e?.stopPropagation(); onDeleteAgency?.(r.대리점코드, true); }}
            onCancel={(e) => e?.stopPropagation()}
            okText="삭제" cancelText="취소" okType="danger">
            <Button type="text" danger size="small" icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </Space>
      ),
    },
  ], [openEditModal, onDeleteAgency]);

  return (
    <div style={{ padding: 24 }}>

      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Space>
          <TeamOutlined style={{ fontSize: 20, color: '#0054A6' }} />
          <Typography.Title level={4} style={{ margin: 0 }}>대리점 관리</Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {filtered.length}개{filtered.length !== enriched.length && ` / 전체 ${enriched.length}`}
          </Typography.Text>
        </Space>
        <Space>
          <Input prefix={<SearchOutlined style={{ color: '#999' }} />}
            placeholder="대리점명 · 코드 · 담당자 검색"
            value={search} onChange={(e) => setSearch(e.target.value)}
            allowClear style={{ width: 240, borderRadius: 8 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openNewModal}
            style={{ background: '#0054A6' }}>
            대리점 추가
          </Button>
        </Space>
      </div>

      {/* 범례 */}
      <Space size={16} style={{ marginBottom: 12 }}>
        <Space size={4}>
          <span style={{ display: 'inline-block', width: 14, height: 14, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 3 }} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>A등급</Typography.Text>
        </Space>
        <Space size={4}>
          <span style={{ display: 'inline-block', width: 14, height: 14, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 3 }} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>B등급</Typography.Text>
        </Space>
        <Space size={4}>
          <span style={{ display: 'inline-block', width: 14, height: 14, background: '#fff', border: '2px solid #0054A6', borderRadius: 3 }} />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>공식인증</Typography.Text>
        </Space>
      </Space>

      {/* ── 테이블 ── */}
      <Card size="small" style={{ borderRadius: 10, borderColor: '#dde8f5' }} styles={{ body: { padding: 0 } }}>
        <Table
          size="small" columns={columns} dataSource={filtered} rowKey="대리점코드"
          scroll={{ x: 1180 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t}개` }}
          rowClassName={getRowClassName}
          onRow={(record) => ({
            onClick: () => setSelected(record.대리점코드 === selected?.대리점코드 ? null : record),
            style: {
              cursor: 'pointer',
              ...(record.대리점코드 === selected?.대리점코드 ? { outline: '2px solid #0054A6', outlineOffset: -2 } : {}),
            },
          })}
          locale={{ emptyText: search ? '검색 결과가 없습니다' : '대리점 데이터가 없습니다' }}
        />
      </Card>

      {/* ── 하단 상세 패널 ── */}
      {selected && <AgencyDetail agency={selected} quotes={quotes} dailyLogs={dailyLogs} />}

      {/* ── 수정/추가 모달 ── */}
      <EditAgencyModal
        open={!!editTarget}
        agency={editTarget}
        isNew={isNewMode}
        onSave={handleModalSave}
        onCancel={handleModalCancel}
      />

      <style jsx global>{`
        .agency-grade-a td { background: #fffbe6 !important; }
        .agency-grade-a:hover td { background: #fff1b8 !important; }
        .agency-grade-b td { background: #f6ffed !important; }
        .agency-grade-b:hover td { background: #d9f7be !important; }
        .agency-certified td { border-left: 3px solid #0054A6 !important; }
        .agency-certified td:first-child { border-left: 3px solid #0054A6 !important; }
      `}</style>
    </div>
  );
}
