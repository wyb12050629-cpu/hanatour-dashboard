'use client';

/**
 * components/tabs/DailyLogTab.jsx
 * 일일 활동 로그 탭 — 빠른 추가, EditLogModal 수정, 주차별 그룹, 필터
 */

import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Typography, Table, Tag, Space, Card, Input, Select, InputNumber,
  DatePicker, Button, Switch, AutoComplete, Row, Col, App,
  Popconfirm, Modal,
} from 'antd';
import {
  BarChartOutlined, PlusOutlined, SearchOutlined, EditOutlined,
  CalendarOutlined, CheckCircleOutlined, DeleteOutlined, SaveOutlined,
} from '@ant-design/icons';
import { formatKRW, getCurrentWeekRange, getWeekWednesday } from '@/lib/store';

const { RangePicker } = DatePicker;

const TASK_OPTIONS = [
  { value: '견적', label: '견적' },
  { value: '예약', label: '예약' },
  { value: '방문', label: '방문' },
  { value: '전화', label: '전화' },
  { value: '기타', label: '기타' },
];
const YESNO_OPT = [{ value: 0, label: '아니오' }, { value: 1, label: '예' }];
const STATUS_OPT = [
  { value: '대기', label: '대기' },
  { value: '진행중', label: '진행중' },
  { value: '완료', label: '완료' },
];
const REPORT_OPT = [
  { value: '공식인증', label: '공식인증' },
  { value: '일반대리점', label: '일반대리점' },
];

const labelSt = { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 };
const fieldSt = { marginBottom: 10 };

// getWeekWednesday는 @/lib/store에서 import (문자열 'YYYY-MM-DD' 반환)

// ─────────────────────────────────────────────
// EditLogModal
// ─────────────────────────────────────────────

function EditLogModal({ open, log, agencies, onSave, onCancel }) {
  const [form, setForm] = useState({});
  const { message } = App.useApp();

  const current = useMemo(() => {
    if (!open) return {};
    return { ...log, ...form };
  }, [open, log, form]);

  const patch = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // 날짜 변경 시 주차 자동 계산
  const handleDateChange = (d) => {
    if (d) {
      setForm((f) => ({
        ...f,
        날짜: d.format('YYYY-MM-DD'),
        주차: getWeekWednesday(d),
      }));
    } else {
      setForm((f) => ({ ...f, 날짜: '', 주차: '' }));
    }
  };

  const agencyOptions = useMemo(
    () => (agencies || []).map((a) => ({
      value: a.대리점명,
      label: `${a.대리점명} (${a.대리점코드})`,
      code: a.대리점코드,
      report: a.보고구분,
    })),
    [agencies],
  );

  const handleAgencySelect = (val, opt) => {
    setForm((f) => ({
      ...f,
      대리점명: val,
      대리점코드: opt.code || '',
      보고구분: opt.report || '',
    }));
  };

  const handleSave = () => {
    if (!current.날짜) { message.warning('날짜를 입력하세요.'); return; }
    if (!current.대리점명 && !current.대리점코드) { message.warning('대리점을 입력하세요.'); return; }
    onSave?.(current);
    setForm({});
  };

  const handleCancel = () => { setForm({}); onCancel?.(); };

  // 계산된 주차 표시
  const wedDisplay = current.날짜 ? getWeekWednesday(current.날짜) || '' : current.주차 || '';

  return (
    <Modal
      open={open} onCancel={handleCancel} width={720} centered destroyOnHidden
      title={
        <Space>
          <EditOutlined style={{ color: '#52c41a' }} />
          <span>활동 로그 수정</span>
          {current.날짜 && <Tag color="blue">{current.날짜}</Tag>}
        </Space>
      }
      footer={[
        <Button key="cancel" onClick={handleCancel}>취소</Button>,
        <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}
          style={{ background: '#52c41a', borderColor: '#52c41a' }}>저장</Button>,
      ]}
    >
      <Row gutter={12}>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>날짜</span>
          <DatePicker size="small" style={{ width: '100%' }}
            value={current.날짜 ? dayjs(current.날짜) : null}
            onChange={handleDateChange} />
        </div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>주차 (수요일) <Tag style={{ fontSize: 10 }}>자동</Tag></span>
          <Input size="small" value={wedDisplay} disabled />
        </div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>대리점코드</span>
          <Input size="small" value={current.대리점코드 || ''} onChange={(e) => patch('대리점코드', e.target.value)} />
        </div></Col>
        <Col span={12}><div style={fieldSt}><span style={labelSt}>대리점명</span>
          <AutoComplete size="small" value={current.대리점명 || ''} onChange={(v) => patch('대리점명', v)}
            onSelect={handleAgencySelect} options={agencyOptions}
            filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            style={{ width: '100%' }} />
        </div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>보고구분</span>
          <Select size="small" value={current.보고구분 || undefined} onChange={(v) => patch('보고구분', v)}
            options={REPORT_OPT} style={{ width: '100%' }} allowClear />
        </div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>업무구분</span>
          <Select size="small" value={current.업무구분 || undefined} onChange={(v) => patch('업무구분', v)}
            options={TASK_OPTIONS} style={{ width: '100%' }} />
        </div></Col>
        <Col span={10}><div style={fieldSt}><span style={labelSt}>상품코드</span>
          <Input size="small" value={current.상품코드 || ''} onChange={(e) => patch('상품코드', e.target.value)} />
        </div></Col>
        <Col span={7}><div style={fieldSt}><span style={labelSt}>견적인입여부</span>
          <Select size="small" value={current.견적인입여부 ?? 0} onChange={(v) => patch('견적인입여부', v)}
            options={YESNO_OPT} style={{ width: '100%' }} />
        </div></Col>
        <Col span={7}><div style={fieldSt}><span style={labelSt}>체결여부</span>
          <Select size="small" value={current.체결여부 ?? 0} onChange={(v) => patch('체결여부', v)}
            options={YESNO_OPT} style={{ width: '100%' }} />
        </div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>인원</span>
          <InputNumber size="small" value={current.인원 || 0} onChange={(v) => patch('인원', v)} min={0} style={{ width: '100%' }} />
        </div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>매출</span>
          <InputNumber size="small" value={current.매출 || 0} onChange={(v) => patch('매출', v)} style={{ width: '100%' }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v.replace(/,/g, '')} />
        </div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>상태</span>
          <Select size="small" value={current.상태 || '진행중'} onChange={(v) => patch('상태', v)}
            options={STATUS_OPT} style={{ width: '100%' }} />
        </div></Col>
        <Col span={24}><div style={fieldSt}><span style={labelSt}>내용</span>
          <Input.TextArea size="small" rows={2} value={current.내용 || ''} onChange={(e) => patch('내용', e.target.value)} />
        </div></Col>
        <Col span={24}><div style={fieldSt}><span style={labelSt}>다음액션</span>
          <Input size="small" value={current.다음액션 || ''} onChange={(e) => patch('다음액션', e.target.value)} />
        </div></Col>
      </Row>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// 빠른 입력 행
// ─────────────────────────────────────────────

const EMPTY_FORM = { 날짜: null, 대리점명: '', 대리점코드: '', 업무구분: '견적', 상품코드: '', 내용: '' };

function QuickAddRow({ agencies, onAdd }) {
  const { message } = App.useApp();
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const agencyOptions = useMemo(
    () => agencies.map((a) => ({ value: a.대리점명, label: `${a.대리점명} (${a.대리점코드})`, code: a.대리점코드, report: a.보고구분 })),
    [agencies],
  );
  const patch = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const handleAgencySelect = (val, option) => { setForm((f) => ({ ...f, 대리점명: val, 대리점코드: option.code || '' })); };

  const handleAdd = () => {
    if (!form.날짜) { message.warning('날짜를 선택하세요.'); return; }
    if (!form.대리점명) { message.warning('대리점명을 입력하세요.'); return; }
    const dateStr = form.날짜.format('YYYY-MM-DD');
    const matched = agencies.find((a) => a.대리점명 === form.대리점명);
    onAdd?.({
      날짜: dateStr,
      주차: getWeekWednesday(dateStr),
      대리점코드: form.대리점코드 || matched?.대리점코드 || '',
      대리점명: form.대리점명,
      보고구분: matched?.보고구분 || '',
      업무구분: form.업무구분,
      상품코드: form.상품코드,
      견적인입여부: form.업무구분 === '견적' ? 1 : 0,
      체결여부: 0, 인원: 0, 매출: 0,
      내용: form.내용, 다음액션: '', 상태: '진행중',
    });
    setForm({ ...EMPTY_FORM });
    message.success('로그가 추가되었습니다.');
  };

  return (
    <Card size="small" style={{ marginBottom: 16, borderRadius: 10, borderColor: '#b7eb8f', background: '#f6ffed' }}
      styles={{ body: { padding: '10px 16px' } }}>
      <Space wrap size={8} style={{ width: '100%' }}>
        <PlusOutlined style={{ color: '#52c41a', fontSize: 14 }} />
        <DatePicker size="small" placeholder="날짜" value={form.날짜} onChange={(d) => patch('날짜', d)} style={{ width: 120 }} />
        <AutoComplete size="small" placeholder="대리점명" value={form.대리점명} onChange={(v) => patch('대리점명', v)}
          onSelect={handleAgencySelect} options={agencyOptions}
          filterOption={(input, opt) => (opt?.value ?? '').toLowerCase().includes(input.toLowerCase()) || (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          style={{ width: 160 }} />
        <Select size="small" value={form.업무구분} onChange={(v) => patch('업무구분', v)} options={TASK_OPTIONS} style={{ width: 90 }} />
        <Input size="small" placeholder="상품코드" value={form.상품코드} onChange={(e) => patch('상품코드', e.target.value)} style={{ width: 110 }} />
        <Input size="small" placeholder="내용" value={form.내용} onChange={(e) => patch('내용', e.target.value)} style={{ width: 200 }} onPressEnter={handleAdd} />
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAdd}
          style={{ background: '#52c41a', borderColor: '#52c41a' }}>추가</Button>
      </Space>
    </Card>
  );
}

// ─────────────────────────────────────────────
// 주차별 그룹 헤더
// ─────────────────────────────────────────────

function WeekGroupHeader({ weekStr, logs }) {
  const inb = logs.filter((r) => r.견적인입여부 === 1).length;
  const stl = logs.filter((r) => r.체결여부 === 1).length;
  const rev = logs.reduce((s, r) => s + (r.매출 || 0), 0);
  return (
    <Space size={16}>
      <Typography.Text strong style={{ color: '#0054A6' }}>
        <CalendarOutlined style={{ marginRight: 4 }} />주차 {weekStr}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{logs.length}건</Typography.Text>
      <Tag color="blue">인입 {inb}</Tag>
      <Tag color="green">체결 {stl}</Tag>
      {rev > 0 && <Tag color="gold">{formatKRW(rev)}</Tag>}
    </Space>
  );
}

// ─────────────────────────────────────────────
// 테이블 컬럼 (모듈 레벨)
// ─────────────────────────────────────────────

const BASE_COLUMNS = [
  { title: '날짜', dataIndex: '날짜', width: 120, sorter: (a, b) => (a.날짜 || '').localeCompare(b.날짜 || ''), defaultSortOrder: 'descend' },
  { title: '주차(수)', dataIndex: '주차', width: 130 },
  { title: '대리점명', dataIndex: '대리점명', width: 130, ellipsis: true, render: (v) => <Typography.Text strong>{v}</Typography.Text> },
  { title: '보고구분', dataIndex: '보고구분', width: 90, render: (v) => <Tag color={v === '공식인증' ? 'blue' : 'default'}>{v || '—'}</Tag> },
  { title: '업무', dataIndex: '업무구분', width: 65, render: (v) => <Tag color={{ 견적: 'processing', 예약: 'success', 방문: 'warning' }[v] ?? 'default'}>{v || '—'}</Tag> },
  { title: '상품코드', dataIndex: '상품코드', width: 110, ellipsis: true },
  { title: '인입', dataIndex: '견적인입여부', width: 50, align: 'center', render: (v) => v === 1 ? <CheckCircleOutlined style={{ color: '#1677ff' }} /> : <Typography.Text type="secondary">—</Typography.Text> },
  { title: '체결', dataIndex: '체결여부', width: 50, align: 'center', render: (v) => v === 1 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <Typography.Text type="secondary">—</Typography.Text> },
  { title: '인원', dataIndex: '인원', width: 55, align: 'right', render: (v) => v > 0 ? `${v}명` : '—' },
  { title: '매출', dataIndex: '매출', width: 110, align: 'right', sorter: (a, b) => (a.매출 || 0) - (b.매출 || 0),
    render: (v) => v > 0 ? <Typography.Text strong style={{ color: '#0054A6' }}>{formatKRW(v)}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text> },
  { title: '내용', dataIndex: '내용', ellipsis: true, width: 160 },
  { title: '다음액션', dataIndex: '다음액션', ellipsis: true, width: 110 },
];

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function DailyLogTab({
  dailyLogs = [], agencies = [],
  onAddLog, onUpdateLog, onDeleteLog,
  isAdmin,
}) {
  const { message } = App.useApp();
  const [filterDates, setDates] = useState(null);
  const [filterReport, setReport] = useState(null);
  const [filterTask, setTask] = useState(null);
  const [grouped, setGrouped] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // ── 컬럼 (수정+삭제 컬럼 포함) ──
  const columns = useMemo(() => [
    ...BASE_COLUMNS,
    ...(isAdmin ? [{
      title: '', width: 65, align: 'center', fixed: 'right',
      render: (_, r) => {
        const key = `${r.날짜}__${r.대리점코드}__${r.상품코드}`;
        return (
          <Space size={2}>
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={(e) => { e.stopPropagation(); setEditTarget(r); }}
              style={{ color: '#52c41a' }} />
            <Popconfirm title="이 활동 로그를 삭제하시겠습니까?" okText="삭제" cancelText="취소" okType="danger"
              onConfirm={(e) => { e?.stopPropagation(); onDeleteLog?.(key); }}>
              <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
            </Popconfirm>
          </Space>
        );
      },
    }] : []),
  ], [onDeleteLog, isAdmin]);

  // ── 필터링 ──
  const filtered = useMemo(() => {
    let data = [...dailyLogs];
    if (filterReport) data = data.filter((r) => r.보고구분 === filterReport);
    if (filterTask) data = data.filter((r) => r.업무구분 === filterTask);
    if (filterDates?.[0] && filterDates?.[1]) {
      const [s, e] = filterDates;
      data = data.filter((r) => r.날짜 && !dayjs(r.날짜).isBefore(s, 'day') && !dayjs(r.날짜).isAfter(e, 'day'));
    }
    return data;
  }, [dailyLogs, filterReport, filterTask, filterDates]);

  // ── 주차별 그룹 ──
  const groupedData = useMemo(() => {
    if (!grouped) return null;
    const map = new Map();
    for (const log of filtered) { const k = log.주차 || '(미분류)'; if (!map.has(k)) map.set(k, []); map.get(k).push(log); }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a)).map(([week, logs]) => ({ week, logs }));
  }, [filtered, grouped]);

  const hasFilter = filterDates || filterReport || filterTask;
  const stats = useMemo(() => ({
    total: filtered.length,
    인입: filtered.filter((r) => r.견적인입여부 === 1).length,
    체결: filtered.filter((r) => r.체결여부 === 1).length,
    매출: filtered.reduce((s, r) => s + (r.매출 || 0), 0),
  }), [filtered]);

  // ── 수정 핸들러 ──
  const handleEditSave = useCallback((updated) => {
    // 원본 복합키로 업데이트
    const originalKey = editTarget
      ? `${editTarget.날짜}__${editTarget.대리점코드}__${editTarget.상품코드}`
      : null;
    if (originalKey) {
      onUpdateLog?.(originalKey, updated);
      message.success('로그가 수정되었습니다.');
    }
    setEditTarget(null);
  }, [editTarget, onUpdateLog, message]);

  return (
    <div style={{ padding: 24 }}>
      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Space>
          <BarChartOutlined style={{ fontSize: 20, color: '#52c41a' }} />
          <Typography.Title level={4} style={{ margin: 0 }}>일일 활동 로그</Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {filtered.length.toLocaleString()}건
            {filtered.length !== dailyLogs.length && ` / 전체 ${dailyLogs.length.toLocaleString()}`}
          </Typography.Text>
        </Space>
        <Space size={16}>
          <Row gutter={8}>
            {[
              { label: '인입', val: stats.인입, color: '#1677ff' },
              { label: '체결', val: stats.체결, color: '#52c41a' },
              { label: '매출', val: formatKRW(stats.매출), color: '#fa8c16' },
            ].map(({ label, val, color }) => (
              <Col key={label}>
                <Typography.Text type="secondary" style={{ fontSize: 11, marginRight: 2 }}>{label}</Typography.Text>
                <Typography.Text strong style={{ color, fontSize: 13 }}>{typeof val === 'number' ? val.toLocaleString() : val}</Typography.Text>
              </Col>
            ))}
          </Row>
          <Space size={4}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>주차별</Typography.Text>
            <Switch size="small" checked={grouped} onChange={setGrouped} />
          </Space>
        </Space>
      </div>

      {isAdmin && <QuickAddRow agencies={agencies} onAdd={onAddLog} />}

      {/* ── 필터 바 ── */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 10, borderColor: '#dde8f5' }} styles={{ body: { padding: '10px 16px' } }}>
        <Space wrap size={12}>
          <RangePicker size="small" placeholder={['시작일', '종료일']} value={filterDates} onChange={setDates} style={{ width: 230 }} />
          <Select placeholder="보고구분" allowClear value={filterReport} onChange={setReport} options={REPORT_OPT} style={{ width: 120 }} size="small" />
          <Select placeholder="업무구분" allowClear value={filterTask} onChange={setTask} options={TASK_OPTIONS} style={{ width: 100 }} size="small" />
          {hasFilter && <Button size="small" type="link" danger onClick={() => { setDates(null); setReport(null); setTask(null); }}>필터 초기화</Button>}
        </Space>
      </Card>

      {/* ── 테이블 ── */}
      {grouped && groupedData ? (
        <Space orientation="vertical" size={16} style={{ width: '100%', display: 'flex' }}>
          {groupedData.map(({ week, logs }) => (
            <Card key={week} size="small" title={<WeekGroupHeader weekStr={week} logs={logs} />}
              style={{ borderRadius: 10, borderColor: '#dde8f5' }} styles={{ body: { padding: 0 } }}>
              <Table size="small" columns={columns} dataSource={logs}
                rowKey={(r) => `${r.날짜}__${r.대리점코드}__${r.상품코드}`}
                pagination={false} scroll={{ x: 1280 }}
                rowClassName={(r) => r.체결여부 === 1 ? 'dailylog-settled-row' : ''} />
            </Card>
          ))}
          {groupedData.length === 0 && (
            <Card size="small" style={{ textAlign: 'center', padding: 40, borderRadius: 10 }}>
              <Typography.Text type="secondary">해당하는 로그가 없습니다.</Typography.Text>
            </Card>
          )}
        </Space>
      ) : (
        <Card size="small" style={{ borderRadius: 10, borderColor: '#dde8f5' }} styles={{ body: { padding: 0 } }}>
          <Table size="small" columns={columns} dataSource={filtered}
            rowKey={(r) => `${r.날짜}__${r.대리점코드}__${r.상품코드}__${r.내용?.slice(0, 10)}`}
            scroll={{ x: 1280 }}
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t}건` }}
            rowClassName={(r) => r.체결여부 === 1 ? 'dailylog-settled-row' : ''}
            locale={{ emptyText: '로그 데이터가 없습니다.' }} />
        </Card>
      )}

      {/* ── 수정 모달 ── */}
      <EditLogModal
        open={!!editTarget}
        log={editTarget}
        agencies={agencies}
        onSave={handleEditSave}
        onCancel={() => setEditTarget(null)}
      />

      <style jsx global>{`
        .dailylog-settled-row td { background: #f6ffed !important; }
        .dailylog-settled-row:hover td { background: #d9f7be !important; }
      `}</style>
    </div>
  );
}
