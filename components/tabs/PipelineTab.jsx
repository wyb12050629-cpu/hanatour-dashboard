'use client';

/**
 * components/tabs/PipelineTab.jsx
 * 견적 파이프라인 탭 - 상태별 관리, 인센 연동 뱃지, 견적 상세 모달
 */

import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Typography, Table, Tag, Space, Card, Input, Select, Popconfirm,
  DatePicker, Button, Modal, Descriptions, Row, Col, Divider, App,
  AutoComplete, InputNumber,
} from 'antd';
import {
  FileTextOutlined, SearchOutlined, DollarOutlined, PlusOutlined,
  CheckCircleOutlined, EditOutlined, SaveOutlined,
  FunnelPlotOutlined, LinkOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { formatKRW, getQuarterRange } from '@/lib/store';
import IncentiveDetailModal from '@/components/IncentiveDetailModal';

const { RangePicker } = DatePicker;

const STATUS_OPT = [
  { value: '체결',   label: '체결' },
  { value: '협의중', label: '협의중' },
  { value: '미체결', label: '미체결' },
];
const STATUS_COLOR = { 체결: 'success', 협의중: 'processing', 미체결: 'error' };
const REPORT_COLOR = { 공식인증: 'blue', 일반대리점: 'default' };

// ─────────────────────────────────────────────
// 견적 편집 모달 (신규 추가 + 수정 겸용)
// ─────────────────────────────────────────────

const labelSt = { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 };
const fieldSt = { marginBottom: 10 };

function QuoteEditModal({ open, quote, isNew, agencies, incentive, onSave, onCancel, onOpenIncentive }) {
  const [form, setForm] = useState({});
  const { message } = App.useApp();

  const current = useMemo(() => {
    if (!open) return {};
    return isNew
      ? { 견적번호: '', 대리점코드: '', 대리점명: '', 보고구분: '', 등록일: dayjs().format('YYYY-MM-DD'),
          출발일: '', 인원: 0, 가격: 0, 상품코드: '', 상태: '협의중', 다음할일: '', 메모: '', ...form }
      : { ...quote, ...form };
  }, [open, quote, isNew, form]);

  const patch = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const agencyOptions = useMemo(
    () => (agencies || []).map((a) => ({ value: a.대리점명, label: `${a.대리점명} (${a.대리점코드})`, code: a.대리점코드, report: a.보고구분 })),
    [agencies],
  );

  const handleAgencySelect = (val, opt) => {
    setForm((f) => ({ ...f, 대리점명: val, 대리점코드: opt.code || '', 보고구분: opt.report || '' }));
  };

  const handleSave = () => {
    if (!current.견적번호?.trim()) { message.warning('견적번호를 입력하세요.'); return; }
    if (!current.대리점명?.trim()) { message.warning('대리점명을 선택하세요.'); return; }
    onSave?.(current);
    setForm({});
  };

  const handleCancel = () => { setForm({}); onCancel?.(); };

  return (
    <Modal open={open} onCancel={handleCancel} width={720} centered destroyOnHidden
      title={<Space><FileTextOutlined style={{ color: '#fa8c16' }} />
        <span>{isNew ? '신규 견적 추가' : '견적 수정'}</span>
        {!isNew && <Typography.Text code style={{ fontSize: 12 }}>{quote?.견적번호}</Typography.Text>}
      </Space>}
      footer={[
        <Button key="cancel" onClick={handleCancel}>취소</Button>,
        <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave} style={{ background: '#fa8c16' }}>
          {isNew ? '추가' : '저장'}
        </Button>,
      ]}
    >
      <Row gutter={12}>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>견적번호</span>
          <Input size="small" value={current.견적번호 || ''} onChange={(e) => patch('견적번호', e.target.value)} disabled={!isNew} />
        </div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>대리점명</span>
          <AutoComplete size="small" value={current.대리점명 || ''} onChange={(v) => patch('대리점명', v)}
            onSelect={handleAgencySelect} options={agencyOptions}
            filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            style={{ width: '100%' }} placeholder="대리점 선택" />
        </div></Col>
        <Col span={4}><div style={fieldSt}><span style={labelSt}>대리점코드</span>
          <Input size="small" value={current.대리점코드 || ''} disabled />
        </div></Col>
        <Col span={4}><div style={fieldSt}><span style={labelSt}>보고구분</span>
          <Input size="small" value={current.보고구분 || ''} disabled />
        </div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>등록일</span>
          <DatePicker size="small" style={{ width: '100%' }} value={current.등록일 ? dayjs(current.등록일) : null}
            onChange={(d) => patch('등록일', d ? d.format('YYYY-MM-DD') : '')} />
        </div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>출발일</span>
          <DatePicker size="small" style={{ width: '100%' }} value={current.출발일 ? dayjs(current.출발일) : null}
            onChange={(d) => patch('출발일', d ? d.format('YYYY-MM-DD') : '')} />
        </div></Col>
        <Col span={4}><div style={fieldSt}><span style={labelSt}>인원</span>
          <InputNumber size="small" value={current.인원 || 0} onChange={(v) => patch('인원', v)} min={0} style={{ width: '100%' }} />
        </div></Col>
        <Col span={4}><div style={fieldSt}><span style={labelSt}>가격</span>
          <InputNumber size="small" value={current.가격 || 0} onChange={(v) => patch('가격', v)} style={{ width: '100%' }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v.replace(/,/g, '')} />
        </div></Col>
        <Col span={10}><div style={fieldSt}><span style={labelSt}>상품코드</span>
          <Input size="small" value={current.상품코드 || ''} onChange={(e) => patch('상품코드', e.target.value)} />
        </div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>상태</span>
          <Select size="small" value={current.상태 || '협의중'} onChange={(v) => patch('상태', v)}
            options={STATUS_OPT} style={{ width: '100%' }} />
        </div></Col>
        <Col span={12}><div style={fieldSt}><span style={labelSt}>다음할일</span>
          <Input size="small" value={current.다음할일 || ''} onChange={(e) => patch('다음할일', e.target.value)} />
        </div></Col>
        <Col span={12}><div style={fieldSt}><span style={labelSt}>메모</span>
          <Input.TextArea size="small" rows={1} value={current.메모 || ''} onChange={(e) => patch('메모', e.target.value)} />
        </div></Col>
      </Row>

      {/* 인센 연동 카드 (수정 시만) */}
      {!isNew && incentive && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div onClick={() => { handleCancel(); setTimeout(() => onOpenIncentive?.(incentive), 100); }}
            style={{ background: '#f9f5ff', border: '1px solid #d9c8f5', borderRadius: 8, padding: '12px 16px', cursor: 'pointer' }}>
            <Space style={{ marginBottom: 8 }}>
              <DollarOutlined style={{ color: '#722ed1' }} />
              <Typography.Text strong style={{ color: '#722ed1' }}>연결된 인센티브 정산</Typography.Text>
              <Tag color="purple" style={{ fontSize: 10 }}>클릭하여 상세 보기</Tag>
            </Space>
            <Row gutter={16}>
              {[{ label: '총매출액', val: formatKRW(incentive.총매출액) },
                { label: '하나투어 수익', val: formatKRW(incentive.하나투어수익) },
                { label: '최종입금가', val: formatKRW(incentive.최종입금가) },
              ].map(({ label, val }) => (
                <Col span={8} key={label} style={{ textAlign: 'center' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>{label}</Typography.Text>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#722ed1' }}>{val}</div>
                </Col>
              ))}
            </Row>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function PipelineTab({
  quotes = [],
  agencies = [],
  incentives = [],
  quarterly = {},
  isAdmin,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  onUpdateIncentive,
}) {
  const { message } = App.useApp();

  // ── 필터 상태 ──
  const [search, setSearch]           = useState('');
  const [filterStatus, setStatus]     = useState(null);
  const [filterReport, setReport]     = useState(null);
  const [filterDates, setDates]       = useState(null);
  const [filterQuarter, setQuarter]   = useState(null);

  // ── 모달 상태 ──
  const [selectedQuote, setSelectedQuote]   = useState(null);
  const [isNewQuote, setIsNewQuote]         = useState(false);
  const [selectedIncent, setSelectedIncent] = useState(null);

  // ── 인센 맵 (견적번호 → 인센 레코드) ──
  const incentiveMap = useMemo(() => {
    const m = new Map();
    for (const inc of incentives) {
      if (inc.온라인견적번호) m.set(inc.온라인견적번호, inc);
    }
    return m;
  }, [incentives]);

  // ── 견적 맵 (견적번호 → 견적 레코드, 인센 모달의 quoteInfo 용) ──
  const quoteMap = useMemo(() => {
    const m = new Map();
    for (const q of quotes) if (q.견적번호) m.set(q.견적번호, q);
    return m;
  }, [quotes]);

  // ── 필터링 ──
  const filtered = useMemo(() => {
    let data = [...quotes];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((r) =>
        (r.대리점명 || '').toLowerCase().includes(q) ||
        (r.견적번호 || '').toLowerCase().includes(q),
      );
    }
    if (filterStatus) data = data.filter((r) => r.상태 === filterStatus);
    if (filterReport) data = data.filter((r) => r.보고구분 === filterReport);
    if (filterDates?.[0] && filterDates?.[1]) {
      const [s, e] = filterDates;
      data = data.filter((r) => {
        if (!r.등록일) return false;
        const d = dayjs(r.등록일);
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
  }, [quotes, search, filterStatus, filterReport, filterDates, filterQuarter]);

  // ── 소계 ──
  const subtotal = useMemo(() => ({
    인원: filtered.reduce((s, r) => s + (r.인원 || 0), 0),
    가격: filtered.reduce((s, r) => s + (r.가격 || 0), 0),
    체결: filtered.filter((r) => r.상태 === '체결').length,
    협의중: filtered.filter((r) => r.상태 === '협의중').length,
  }), [filtered]);

  const hasFilter = search || filterStatus || filterReport || filterDates || filterQuarter;

  // ── 핸들러 ──
  const handleQuoteSave = useCallback((updated) => {
    if (isNewQuote) {
      onAddQuote?.(updated);
      message.success('견적이 추가되었습니다.');
    } else {
      onUpdateQuote?.(updated);
      message.success('견적 정보가 저장되었습니다.');
    }
    setSelectedQuote(null);
    setIsNewQuote(false);
  }, [isNewQuote, onAddQuote, onUpdateQuote, message]);

  const handleDeleteQuote = useCallback((quoteId, e) => {
    e?.stopPropagation();
    onDeleteQuote?.(quoteId);
    message.success('견적이 삭제되었습니다.');
  }, [onDeleteQuote, message]);

  const handleIncentSave = useCallback((updated) => {
    onUpdateIncentive?.(updated);
    setSelectedIncent(null);
    message.success('인센티브 정보가 저장되었습니다.');
  }, [onUpdateIncentive, message]);

  // ── 컬럼 ──
  const columns = useMemo(() => [
    {
      title: '견적번호', dataIndex: '견적번호', width: 130, ellipsis: true, fixed: 'left',
      render: (v) => <Typography.Text code>{v}</Typography.Text>,
    },
    {
      title: '대리점명', dataIndex: '대리점명', width: 150, ellipsis: true,
      render: (v, r) => (
        <Space size={4}>
          <Typography.Text strong>{v}</Typography.Text>
          <Tag color={REPORT_COLOR[r.보고구분] ?? 'default'} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
            {r.보고구분 === '공식인증' ? '공식' : '일반'}
          </Tag>
        </Space>
      ),
    },
    { title: '등록일', dataIndex: '등록일', width: 95, sorter: (a, b) => (a.등록일 || '').localeCompare(b.등록일 || '') },
    { title: '출발일', dataIndex: '출발일', width: 95, sorter: (a, b) => (a.출발일 || '').localeCompare(b.출발일 || '') },
    {
      title: '인원', dataIndex: '인원', width: 60, align: 'right',
      sorter: (a, b) => (a.인원 || 0) - (b.인원 || 0),
      render: (v) => v ? `${v}명` : '—',
    },
    { title: '상품코드', dataIndex: '상품코드', width: 110, ellipsis: true },
    {
      title: '상태', dataIndex: '상태', width: 80, align: 'center',
      render: (v) => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v || '—'}</Tag>,
    },
    { title: '다음할일', dataIndex: '다음할일', width: 140, ellipsis: true },
    { title: '메모', dataIndex: '메모', width: 120, ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: '인센',
      width: 70,
      align: 'center',
      render: (_, r) => {
        const inc = incentiveMap.get(r.견적번호);
        if (!inc) return null;
        return (
          <Tag
            color="purple"
            style={{ cursor: 'pointer', fontSize: 10, margin: 0 }}
            onClick={(e) => { e.stopPropagation(); setSelectedIncent(inc); }}
          >
            정산있음
          </Tag>
        );
      },
    },
    ...(isAdmin ? [{
      title: '',
      width: 40,
      align: 'center',
      render: (_, r) => (
        <Popconfirm
          title="견적 삭제"
          description="연결된 인센티브 정산도 함께 삭제됩니다."
          onConfirm={(e) => { e?.stopPropagation(); handleDeleteQuote(r.견적번호); }}
          onCancel={(e) => e?.stopPropagation()}
          okText="삭제"
          cancelText="취소"
          okType="danger"
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()} />
        </Popconfirm>
      ),
    }] : []),
  ], [incentiveMap, handleDeleteQuote, isAdmin]);

  // ── 렌더 ──
  return (
    <div style={{ padding: 24 }}>

      {/* ── 소계 카드 ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: '전체 견적', val: filtered.length, suffix: '건', color: '#0054A6' },
          { label: '체결', val: subtotal.체결, suffix: '건', color: '#52c41a' },
          { label: '협의중', val: subtotal.협의중, suffix: '건', color: '#1677ff' },
          { label: '총 인원', val: subtotal.인원, suffix: '명', color: '#fa8c16' },
          { label: '총 가격 합계', val: formatKRW(subtotal.가격), suffix: '', color: '#722ed1' },
        ].map(({ label, val, suffix, color }) => (
          <Col key={label} xs={12} sm={8} lg={4}>
            <Card size="small" style={{ borderColor: '#dde8f5', borderRadius: 8, textAlign: 'center' }}
              styles={{ body: { padding: '10px 8px' } }}>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>{label}</Typography.Text>
              <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.3 }}>
                {typeof val === 'number' ? val.toLocaleString() : val}
                {suffix && <span style={{ fontSize: 12, fontWeight: 500 }}>{suffix}</span>}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Space>
          <FileTextOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
          <Typography.Title level={4} style={{ margin: 0 }}>견적 파이프라인</Typography.Title>
        </Space>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedQuote({}); setIsNewQuote(true); }}
            style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>견적 추가</Button>
        )}
      </div>

      {/* ── 필터 바 ── */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 10, borderColor: '#dde8f5' }}
        styles={{ body: { padding: '12px 16px' } }}>
        <Space wrap size={12} style={{ width: '100%' }}>
          <Input prefix={<SearchOutlined style={{ color: '#999' }} />}
            placeholder="대리점명 · 견적번호" value={search} onChange={(e) => setSearch(e.target.value)}
            allowClear style={{ width: 200 }} size="small" />
          <Select placeholder="상태" allowClear value={filterStatus} onChange={setStatus}
            options={STATUS_OPT} style={{ width: 110 }} size="small" />
          <Select placeholder="보고구분" allowClear value={filterReport} onChange={setReport}
            options={[{ value: '공식인증', label: '공식인증' }, { value: '일반대리점', label: '일반대리점' }]}
            style={{ width: 120 }} size="small" />
          <Select placeholder="출발 분기" allowClear value={filterQuarter} onChange={setQuarter}
            options={[
              { value: 1, label: '1분기 (1~3월)' },
              { value: 2, label: '2분기 (4~6월)' },
              { value: 3, label: '3분기 (7~9월)' },
              { value: 4, label: '4분기 (10~12월)' },
            ]}
            style={{ width: 140 }} size="small" />
          <RangePicker size="small" placeholder={['등록일 시작', '등록일 끝']}
            value={filterDates} onChange={setDates} style={{ width: 240 }} />
          {hasFilter && (
            <Button size="small" type="link" danger
              onClick={() => { setSearch(''); setStatus(null); setReport(null); setDates(null); setQuarter(null); }}>
              필터 초기화
            </Button>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
            {filtered.length.toLocaleString()}건
            {filtered.length !== quotes.length && ` / 전체 ${quotes.length}`}
          </Typography.Text>
        </Space>
      </Card>

      {/* ── 테이블 ── */}
      <Card size="small" style={{ borderRadius: 10, borderColor: '#dde8f5' }} styles={{ body: { padding: 0 } }}>
        <Table
          size="small"
          columns={columns}
          dataSource={filtered}
          rowKey="견적번호"
          scroll={{ x: 1150 }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `${t}건` }}
          onRow={(record) => ({
            onClick: () => { setSelectedQuote(record); setIsNewQuote(false); },
            style: { cursor: 'pointer' },
          })}
          rowClassName={(r) => r.상태 === '체결' ? 'pipeline-settled-row' : ''}
          locale={{ emptyText: '견적 데이터가 없습니다.' }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={4} align="right">
                  <Typography.Text type="secondary">소계</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {subtotal.인원.toLocaleString()}명
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6} align="center">
                  <Tag color="success">{subtotal.체결}</Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} colSpan={3} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* ── 견적 편집 모달 ── */}
      <QuoteEditModal
        open={!!selectedQuote}
        quote={selectedQuote}
        isNew={isNewQuote}
        agencies={agencies}
        incentive={selectedQuote && !isNewQuote ? incentiveMap.get(selectedQuote.견적번호) ?? null : null}
        onSave={handleQuoteSave}
        onCancel={() => { setSelectedQuote(null); setIsNewQuote(false); }}
        onOpenIncentive={(inc) => setSelectedIncent(inc)}
      />

      {/* ── 인센 상세 모달 (공유 컴포넌트) ── */}
      <IncentiveDetailModal
        open={!!selectedIncent}
        record={selectedIncent}
        quoteInfo={selectedIncent ? quoteMap.get(selectedIncent.온라인견적번호) ?? null : null}
        onSave={handleIncentSave}
        onCancel={() => setSelectedIncent(null)}
      />

      <style jsx global>{`
        .pipeline-settled-row td { background: #f6ffed !important; }
        .pipeline-settled-row:hover td { background: #d9f7be !important; }
      `}</style>
    </div>
  );
}
