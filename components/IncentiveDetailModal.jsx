'use client';

/**
 * components/IncentiveDetailModal.jsx
 * 인센티브 상세 모달 — 정산 내역을 incentive 객체에 직접 저장
 * quarterly 의존성 완전 제거
 */

import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Typography, Tag, Space, Modal, Select, Input, InputNumber,
  Button, Divider, Row, Col, DatePicker, Popconfirm,
} from 'antd';
import {
  DollarOutlined, EditOutlined, SaveOutlined, DeleteOutlined,
  BarChartOutlined, FileTextOutlined, SettingOutlined,
} from '@ant-design/icons';
import { formatKRW } from '@/lib/store';

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const COST_ITEMS = ['항공', '지상', '공동경비', '넷가', '수익', '입금가'];
const OX_OPT = [{ value: 'O', label: 'O' }, { value: 'X', label: 'X' }];
const REGION_OPT = ['동남아', '유럽', '일본', '미주', '중국', '대만', '기타'].map((v) => ({ value: v, label: v }));
const STATUS_OPT = [{ value: '체결', label: '체결' }, { value: '미체결', label: '미체결' }];

const labelSt = { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 };
const fieldSt = { marginBottom: 10 };
const thSt = { padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#666', borderBottom: '2px solid #e6d8f5' };
const tdSt = { padding: '6px 8px' };

function OxTag({ value }) {
  const c = { O: 'success', X: 'error' }[value] ?? 'default';
  return <Tag color={c}>{value || '—'}</Tag>;
}

/** InputNumber with comma formatting */
function MoneyInput({ value, onChange, disabled }) {
  return (
    <InputNumber
      size="small"
      value={value || 0}
      onChange={onChange}
      disabled={disabled}
      style={{ width: '100%' }}
      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      parser={(v) => v.replace(/,/g, '')}
    />
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function IncentiveDetailModal({
  open, record, quoteInfo,
  onSave, onCancel, onDelete,
}) {
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);

  const current = draft ?? record;

  // ── 마진율 계산 (hooks는 조건 분기 전에 모두 호출) ──
  const marginRate = useMemo(() => {
    const rev = current?.총매출액 || 0;
    const profit = current?.하나투어수익 || 0;
    return rev > 0 ? Math.round((profit / rev) * 10000) / 100 : 0;
  }, [current?.총매출액, current?.하나투어수익]);

  if (!record) return null;

  const handleEdit = () => { setDraft({ ...record }); setEditing(true); };
  const handleSave = () => {
    onSave?.({ ...current, 업데이트일: dayjs().format('YYYY-MM-DD') });
    setEditing(false); setDraft(null);
  };
  const handleCancel = () => { setEditing(false); setDraft(null); onCancel?.(); };
  const patch = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  // ── 필드 렌더 헬퍼 ──
  const F_Input = (key) => editing
    ? <Input size="small" value={current[key] || ''} onChange={(e) => patch(key, e.target.value)} />
    : <span>{current[key] || '—'}</span>;

  const F_Num = (key) => editing
    ? <MoneyInput value={current[key]} onChange={(v) => patch(key, v)} />
    : <span style={{ color: '#722ed1', fontWeight: 600 }}>{formatKRW(current[key])}</span>;

  const F_Select = (key, options) => editing
    ? <Select size="small" value={current[key] || undefined} onChange={(v) => patch(key, v)}
        options={options} style={{ width: '100%' }} allowClear />
    : current[key] ? <OxTag value={current[key]} /> : <span>—</span>;

  const F_Date = (key) => editing
    ? <DatePicker size="small" style={{ width: '100%' }}
        value={current[key] ? dayjs(current[key]) : null}
        onChange={(d) => patch(key, d ? d.format('YYYY-MM-DD') : '')} />
    : <span>{current[key] || '—'}</span>;

  return (
    <Modal
      open={open} onCancel={handleCancel} width={900} centered destroyOnHidden
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
      title={
        <Space>
          <DollarOutlined style={{ color: '#722ed1' }} />
          <span>인센티브 상세</span>
          <Tag color={{ 체결: 'success', 미체결: 'error' }[record.체결여부] ?? 'default'}>
            {record.체결여부 || '—'}
          </Tag>
          {record.온라인견적번호 && <Typography.Text code style={{ fontSize: 12 }}>{record.온라인견적번호}</Typography.Text>}
        </Space>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {onDelete && !editing && (
              <Popconfirm title="이 인센티브를 삭제하시겠습니까?" okText="삭제" cancelText="취소" okType="danger"
                onConfirm={() => { onDelete(record.온라인견적번호); handleCancel(); }}>
                <Button danger icon={<DeleteOutlined />}>삭제</Button>
              </Popconfirm>
            )}
          </div>
          <Space>
            {editing ? <>
              <Button onClick={() => { setEditing(false); setDraft(null); }}>취소</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} style={{ background: '#722ed1' }}>저장</Button>
            </> : <>
              <Button onClick={handleCancel}>닫기</Button>
              <Button icon={<EditOutlined />} onClick={handleEdit} style={{ borderColor: '#722ed1', color: '#722ed1' }}>수정</Button>
            </>}
          </Space>
        </div>
      }
    >
      {/* ── 기본정보 ── */}
      <Typography.Text strong style={{ fontSize: 14, display: 'block', marginBottom: 10, color: '#722ed1' }}>
        <FileTextOutlined style={{ marginRight: 6 }} />기본정보
      </Typography.Text>
      <Row gutter={12}>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>대리점명</span>{F_Input('대리점명')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>키맨</span>{F_Input('키맨')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>상품담당자</span>{F_Input('상품담당자')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>상품코드</span>{F_Input('상품코드')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>지역</span>{editing
          ? <Select size="small" value={current.지역 || undefined} onChange={(v) => patch('지역', v)} options={REGION_OPT} style={{ width: '100%' }} allowClear />
          : <span>{current.지역 || '—'}</span>}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>온라인견적번호</span>{F_Input('온라인견적번호')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>출발일</span>{F_Date('출발일')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>인원수</span>{editing
          ? <InputNumber size="small" value={current.인원수 || 0} onChange={(v) => patch('인원수', v)} style={{ width: '100%' }} min={0} />
          : <span>{current.인원수 ?? 0}명</span>}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>팀컬러</span>{F_Input('팀컬러')}</div></Col>
        {quoteInfo && !editing && <>
          <Col span={8}><div style={fieldSt}><span style={labelSt}>등록일 (견적)</span><span>{quoteInfo.등록일 || '—'}</span></div></Col>
          <Col span={8}><div style={fieldSt}><span style={labelSt}>보고구분</span><Tag color={quoteInfo.보고구분 === '공식인증' ? 'blue' : 'default'}>{quoteInfo.보고구분 || '—'}</Tag></div></Col>
        </>}
      </Row>

      <Divider style={{ margin: '12px 0' }} />

      {/* ── 정산 내역 (incentive 객체에 직접 저장) ── */}
      <Typography.Text strong style={{ fontSize: 14, display: 'block', marginBottom: 10, color: '#722ed1' }}>
        <BarChartOutlined style={{ marginRight: 6 }} />정산 내역
      </Typography.Text>

      <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#faf5ff' }}>
              <th style={thSt}>항목</th>
              <th style={{ ...thSt, textAlign: 'right', width: '35%' }}>대리점 단가</th>
              <th style={{ ...thSt, textAlign: 'right', width: '35%' }}>하나투어 단가</th>
            </tr>
          </thead>
          <tbody>
            {COST_ITEMS.map((item) => {
              const keyA = `${item}_대리점`;
              const keyH = `${item}_하나투어`;
              return (
                <tr key={item} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ ...tdSt, fontWeight: 600 }}>{item}</td>
                  <td style={{ ...tdSt, textAlign: 'right' }}>
                    {editing
                      ? <MoneyInput value={current[keyA]} onChange={(v) => patch(keyA, v)} />
                      : <span style={{ color: '#0054A6' }}>{formatKRW(current[keyA] || 0)}</span>}
                  </td>
                  <td style={{ ...tdSt, textAlign: 'right' }}>
                    {editing
                      ? <MoneyInput value={current[keyH]} onChange={(v) => patch(keyH, v)} />
                      : <span style={{ color: '#722ed1' }}>{formatKRW(current[keyH] || 0)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 편집 가능 금액 필드 */}
      <Row gutter={12}>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>최초입금가</span>{F_Num('최초입금가')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>최종입금가</span>{F_Num('최종입금가')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>최종넷가</span>{F_Num('최종넷가')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>총매출액</span>{F_Num('총매출액')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>하나투어 수익</span>{F_Num('하나투어수익')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>지상비</span>{F_Num('지상비')}</div></Col>
        <Col span={12}><div style={fieldSt}><span style={labelSt}>지상특이사항</span>{F_Input('지상특이사항')}</div></Col>
      </Row>

      {/* 마진율 (계산값) */}
      <Row gutter={[12, 8]} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <div style={{ background: '#f9f5ff', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>마진율</Typography.Text>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#722ed1' }}>{marginRate}%</div>
          </div>
        </Col>
      </Row>

      <Divider style={{ margin: '12px 0' }} />

      {/* ── 호텔/옵션 ── */}
      <Typography.Text strong style={{ fontSize: 14, display: 'block', marginBottom: 10 }}>
        <SettingOutlined style={{ marginRight: 6 }} />호텔 / 옵션
      </Typography.Text>
      <Row gutter={12}>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>호텔명</span>{F_Input('호텔명')}</div></Col>
        <Col span={16}><div style={fieldSt}><span style={labelSt}>호텔특이사항</span>{editing
          ? <Input.TextArea size="small" rows={1} value={current.호텔특이사항 || ''} onChange={(e) => patch('호텔특이사항', e.target.value)} />
          : <span>{current.호텔특이사항 || '—'}</span>}</div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>추가옵션</span>{F_Select('추가옵션여부', OX_OPT)}</div></Col>
        <Col span={10}><div style={fieldSt}><span style={labelSt}>추가옵션내용</span>{F_Input('추가옵션내용')}</div></Col>
        <Col span={8}><div style={fieldSt}><span style={labelSt}>가이드형태</span>{F_Input('가이드형태')}</div></Col>
      </Row>

      <Divider style={{ margin: '12px 0' }} />

      {/* ── 진행상태 ── */}
      <Typography.Text strong style={{ fontSize: 14, display: 'block', marginBottom: 10 }}>
        <DollarOutlined style={{ marginRight: 6 }} />진행 상태
      </Typography.Text>
      <Row gutter={12}>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>선발권</span>{F_Select('선발권여부', OX_OPT)}</div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>발권</span>{F_Select('발권여부', OX_OPT)}</div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>계약금납입</span>{F_Select('계약금납입여부', OX_OPT)}</div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>입금완료</span>{F_Select('입금완료', OX_OPT)}</div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>입금가변동</span>{F_Select('입금가변동', OX_OPT)}</div></Col>
        <Col span={6}><div style={fieldSt}><span style={labelSt}>체결여부</span>{editing
          ? <Select size="small" value={current.체결여부 || undefined} onChange={(v) => patch('체결여부', v)}
              options={STATUS_OPT} style={{ width: '100%' }} />
          : <Tag color={{ 체결: 'success', 미체결: 'error' }[current.체결여부] ?? 'default'}>{current.체결여부 || '—'}</Tag>
        }</div></Col>
        <Col span={12}><div style={fieldSt}><span style={labelSt}>업데이트일</span>{F_Date('업데이트일')}</div></Col>
        <Col span={24}><div style={fieldSt}><span style={labelSt}>특이사항/미체결사유</span>{editing
          ? <Input.TextArea size="small" rows={2} value={current.특이사항 || ''} onChange={(e) => patch('특이사항', e.target.value)} />
          : <span>{current.특이사항 || '—'}</span>}</div></Col>
      </Row>
    </Modal>
  );
}
