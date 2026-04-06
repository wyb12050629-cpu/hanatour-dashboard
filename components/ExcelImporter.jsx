'use client';

/**
 * components/ExcelImporter.jsx
 *
 * 엑셀 파일 드래그앤드롭 업로드 → 파싱 미리보기 모달 → 병합 임포트 확정 흐름.
 *
 * antd v6 주의: Typography.Title / Typography.Text 등 forwardRef 서브컴포넌트는
 * 모듈 최상위에서 구조 분해하면 Turbopack이 undefined으로 평가하는 문제가 있습니다.
 * 이 파일에서는 모든 Typography 서브컴포넌트를 `Typography.XXX` 네임스페이스로 직접 참조합니다.
 *
 * Props
 *   onImport  (data: ParsedData) => void   – 병합 임포트 확정 시 호출되는 콜백
 */

import { useState } from 'react';
import {
  Upload,
  Modal,
  Tabs,
  Table,
  Button,
  Spin,
  Alert,
  Tag,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  InboxOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  TeamOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { parseExcelFile, formatKRW } from '@/lib/store';

const { Dragger } = Upload;

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const STATUS_COLOR = {
  체결:  'success',
  협의중: 'processing',
  미체결: 'error',
};

// ─────────────────────────────────────────────
// 서브 컴포넌트: 탭 라벨 (아이콘 + 이름 + 건수)
// ─────────────────────────────────────────────

function TabLabel({ icon, label, count }) {
  return (
    <Space size={4}>
      {icon}
      <span>{label}</span>
      {count != null && (
        <Typography.Text
          type={count > 0 ? 'success' : 'secondary'}
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          {count.toLocaleString()}
        </Typography.Text>
      )}
    </Space>
  );
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 통계 카드 (Daily_Log · 분기 탭)
// ─────────────────────────────────────────────

function StatCard({ icon, label, value, suffix = '건', color = '#0054A6' }) {
  return (
    <div
      style={{
        border: '1px solid #e6edf5',
        borderRadius: 10,
        padding: '20px 24px',
        textAlign: 'center',
        background: '#f8fbff',
        height: '100%',
      }}
    >
      <div style={{ fontSize: 28, color, marginBottom: 6 }}>{icon}</div>
      <Statistic
        value={value}
        suffix={suffix}
        valueStyle={{ color, fontSize: 26, fontWeight: 700 }}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
    </div>
  );
}

// ─────────────────────────────────────────────
// 테이블 컬럼 정의
// ─────────────────────────────────────────────

/** 대리점 탭 컬럼 */
const AGENCY_COLS = [
  {
    title: '코드',
    dataIndex: '대리점코드',
    width: 100,
    ellipsis: true,
  },
  {
    title: '대리점명',
    dataIndex: '대리점명',
    ellipsis: true,
    render: (v) => <Typography.Text strong>{v}</Typography.Text>,
  },
  {
    title: '유형',
    dataIndex: '대리점유형',
    width: 90,
    ellipsis: true,
  },
  {
    title: '보고구분',
    dataIndex: '보고구분',
    width: 100,
    render: (v) => (
      <Tag color={v === '공식인증' ? 'blue' : 'default'}>{v || '—'}</Tag>
    ),
  },
  {
    title: '등급',
    dataIndex: '관리등급',
    width: 60,
    render: (v) => {
      const color = { A: 'gold', B: 'cyan', C: 'default' }[v] ?? 'default';
      return v
        ? <Tag color={color}>{v}</Tag>
        : <Typography.Text type="secondary">—</Typography.Text>;
    },
  },
  {
    title: '담당자',
    dataIndex: '담당자',
    width: 80,
    ellipsis: true,
  },
];

/** 견적 탭 컬럼 */
const QUOTE_COLS = [
  {
    title: '견적번호',
    dataIndex: '견적번호',
    width: 130,
    ellipsis: true,
    render: (v) => <Typography.Text code>{v}</Typography.Text>,
  },
  {
    title: '대리점명',
    dataIndex: '대리점명',
    ellipsis: true,
  },
  {
    title: '등록일',
    dataIndex: '등록일',
    width: 100,
  },
  {
    title: '출발일',
    dataIndex: '출발일',
    width: 100,
  },
  {
    title: '인원',
    dataIndex: '인원',
    width: 60,
    align: 'right',
    render: (v) => (v ? `${v}명` : '—'),
  },
  {
    title: '상태',
    dataIndex: '상태',
    width: 80,
    render: (v) => (
      <Tag color={STATUS_COLOR[v] ?? 'default'}>{v || '—'}</Tag>
    ),
  },
];

/** 인센정리 탭 컬럼 */
const INCENTIVE_COLS = [
  {
    title: '대리점명',
    dataIndex: '대리점명',
    ellipsis: true,
    render: (v) => <Typography.Text strong>{v}</Typography.Text>,
  },
  {
    title: '온라인견적번호',
    dataIndex: '온라인견적번호',
    width: 140,
    ellipsis: true,
    render: (v) =>
      v
        ? <Typography.Text code>{v}</Typography.Text>
        : <Typography.Text type="secondary">—</Typography.Text>,
  },
  {
    title: '출발일',
    dataIndex: '출발일',
    width: 100,
  },
  {
    title: '인원',
    dataIndex: '인원수',
    width: 60,
    align: 'right',
    render: (v) => (v ? `${v}명` : '—'),
  },
  {
    title: '총매출액',
    dataIndex: '총매출액',
    width: 130,
    align: 'right',
    render: (v) => (
      <Typography.Text style={{ color: v > 0 ? '#0054A6' : undefined }}>
        {v > 0 ? formatKRW(v) : '—'}
      </Typography.Text>
    ),
  },
  {
    title: '체결',
    dataIndex: '체결여부',
    width: 75,
    render: (v) => (
      <Tag color={v === '체결' ? 'success' : 'error'}>{v || '—'}</Tag>
    ),
  },
];

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export default function ExcelImporter({ onImport }) {
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [fileName,   setFileName]   = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [modalOpen,  setModalOpen]  = useState(false);

  // ── 파일 선택/드롭 처리 ─────────────────────
  const handleBeforeUpload = async (file) => {
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setError('xlsx 또는 xls 파일만 업로드할 수 있습니다.');
      return false;
    }

    setLoading(true);
    setError(null);
    setFileName(file.name);
    setParsedData(null);

    try {
      const data = await parseExcelFile(file);

      const totalRows =
        data.agencies.length +
        data.quotes.length +
        data.dailyLogs.length +
        data.incentives.length;

      if (totalRows === 0) {
        setError('인식 가능한 데이터가 없습니다. 시트 이름을 확인하세요.');
        return false;
      }

      setParsedData(data);
      setModalOpen(true);
    } catch (err) {
      console.error('[ExcelImporter]', err);
      setError(`파싱 오류: ${err?.message ?? '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }

    return false; // antd Upload 자동 전송 방지
  };

  // ── 병합 임포트 확정 ─────────────────────────
  const handleConfirmImport = () => {
    onImport?.(parsedData);
    setModalOpen(false);
    setParsedData(null);
    setFileName('');
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setParsedData(null);
  };

  // ── 분기 블록 카운트 ─────────────────────────
  const quarterlyCount = parsedData
    ? Object.keys(parsedData.quarterlyDetails ?? {}).length
    : 0;

  // ── 탭 정의 (parsedData 있을 때만 생성) ──────
  const tabItems = parsedData ? [
    // ── 대리점 탭 ──
    {
      key: 'agency',
      label: (
        <TabLabel
          icon={<TeamOutlined />}
          label="대리점"
          count={parsedData.agencies.length}
        />
      ),
      children: (
        <Table
          size="small"
          columns={AGENCY_COLS}
          dataSource={parsedData.agencies}
          rowKey="대리점코드"
          pagination={{ pageSize: 5, showTotal: (t) => `전체 ${t.toLocaleString()}개` }}
          scroll={{ x: 560 }}
          locale={{ emptyText: '감지된 대리점 없음' }}
        />
      ),
    },

    // ── 견적 탭 ──
    {
      key: 'quote',
      label: (
        <TabLabel
          icon={<FileExcelOutlined />}
          label="견적"
          count={parsedData.quotes.length}
        />
      ),
      children: (
        <Table
          size="small"
          columns={QUOTE_COLS}
          dataSource={parsedData.quotes}
          rowKey="견적번호"
          pagination={{ pageSize: 5, showTotal: (t) => `전체 ${t.toLocaleString()}개` }}
          scroll={{ x: 600 }}
          locale={{ emptyText: '감지된 견적 없음' }}
        />
      ),
    },

    // ── Daily Log 탭 ──
    {
      key: 'daily',
      label: (
        <TabLabel
          icon={<CalendarOutlined />}
          label="Daily Log"
          count={parsedData.dailyLogs.length}
        />
      ),
      children: (
        <div style={{ padding: '24px 0' }}>
          <Row gutter={[24, 16]} justify="center">
            <Col span={8}>
              <StatCard
                icon={<DatabaseOutlined />}
                label="감지된 Daily Log 행"
                value={parsedData.dailyLogs.length}
                color="#0054A6"
              />
            </Col>
            <Col span={8}>
              <StatCard
                icon={<CheckCircleOutlined />}
                label="체결 건수"
                value={parsedData.dailyLogs.filter((r) => r.체결여부 === 1).length}
                color="#52c41a"
              />
            </Col>
            <Col span={8}>
              <StatCard
                icon={<BarChartOutlined />}
                label="견적인입 건수"
                value={parsedData.dailyLogs.filter((r) => r.견적인입여부 === 1).length}
                color="#fa8c16"
              />
            </Col>
          </Row>
          <Divider style={{ margin: '20px 0 8px' }} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Daily Log는 데이터 양이 많아 테이블 미리보기를 생략합니다.
            임포트 후 대시보드에서 확인하세요.
          </Typography.Text>
        </div>
      ),
    },

    // ── 인센정리 탭 ──
    {
      key: 'incentive',
      label: (
        <TabLabel
          icon={<BarChartOutlined />}
          label="인센정리"
          count={parsedData.incentives.length}
        />
      ),
      children: (
        <Table
          size="small"
          columns={INCENTIVE_COLS}
          dataSource={parsedData.incentives}
          rowKey={(r) => r.온라인견적번호 || `${r.대리점명}__${r.출발일}`}
          pagination={{ pageSize: 5, showTotal: (t) => `전체 ${t.toLocaleString()}개` }}
          scroll={{ x: 640 }}
          locale={{ emptyText: '감지된 인센티브 없음' }}
        />
      ),
    },

    // ── 분기별 탭 ──
    {
      key: 'quarterly',
      label: (
        <TabLabel
          icon={<CalendarOutlined />}
          label="분기별"
          count={quarterlyCount}
        />
      ),
      children: (
        <div style={{ padding: '24px 0' }}>
          <Row gutter={[24, 16]} justify="center">
            {['2분기', '3분기', '4분기'].map((q) => (
              <Col span={8} key={q}>
                <StatCard
                  icon={<FileExcelOutlined />}
                  label={`${q} 견적 블록`}
                  // quarterlyDetails는 분기 통합 맵이므로 2분기만 전체 카운트 표시,
                  // 3·4분기는 파싱 구조상 동일 맵이어서 '—'로 안내
                  value={q === '2분기' ? quarterlyCount : '—'}
                  suffix={q === '2분기' ? '개' : ''}
                  color="#722ed1"
                />
              </Col>
            ))}
          </Row>
          <Divider style={{ margin: '20px 0 8px' }} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            감지된 총{' '}
            <Typography.Text strong>{quarterlyCount.toLocaleString()}</Typography.Text>
            개 견적 블록 — 분기 데이터는 견적번호 키로 통합 관리됩니다.
          </Typography.Text>
        </div>
      ),
    },
  ] : [];

  // ── 렌더 ──────────────────────────────────────
  return (
    <>
      {/* ── 업로드 드래그 영역 ── */}
      <Spin spinning={loading} tip="파일 파싱 중…" size="large">
        <Dragger
          accept=".xlsx,.xls"
          beforeUpload={handleBeforeUpload}
          showUploadList={false}
          multiple={false}
          disabled={loading}
          style={{ borderRadius: 12 }}
        >
          <div style={{ padding: '12px 0' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#0054A6' }} />
            </p>
            <p
              className="ant-upload-text"
              style={{ fontSize: 16, fontWeight: 600 }}
            >
              엑셀 파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="ant-upload-hint" style={{ color: '#8a9bb0' }}>
              대리점관리_HI327.xlsx &nbsp;·&nbsp; 2026_인센티브_관리.xlsx
            </p>
            <p
              className="ant-upload-hint"
              style={{ fontSize: 12, color: '#b0bcc8' }}
            >
              .xlsx / .xls 파일만 지원 &nbsp;·&nbsp; 파일은 서버에 전송되지 않습니다
            </p>
          </div>
        </Dragger>
      </Spin>

      {/* ── 에러 알림 ── */}
      {error && (
        <Alert
          type="error"
          icon={<WarningOutlined />}
          showIcon
          message={error}
          closable
          onClose={() => setError(null)}
          style={{ marginTop: 12, borderRadius: 8 }}
        />
      )}

      {/* ── 미리보기 모달 ── */}
      <Modal
        open={modalOpen}
        onCancel={handleModalClose}
        width={880}
        centered
        destroyOnHidden
        styles={{ body: { padding: '8px 0 0' } }}
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#1d6f42', fontSize: 18 }} />
            <span>파싱 결과 미리보기</span>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}
            >
              {fileName}
            </Typography.Text>
          </Space>
        }
        footer={[
          <Button key="cancel" onClick={handleModalClose}>
            취소
          </Button>,
          <Button
            key="import"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirmImport}
            style={{ background: '#0054A6' }}
          >
            병합 임포트
          </Button>,
        ]}
      >
        {/* 요약 배너 */}
        {parsedData && (
          <div
            style={{
              background: 'linear-gradient(135deg, #0054A6 0%, #0077cc 100%)',
              borderRadius: 8,
              padding: '12px 24px',
              margin: '0 0 16px',
              display: 'flex',
              gap: 32,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: '대리점',    val: parsedData.agencies.length   },
              { label: '견적',      val: parsedData.quotes.length     },
              { label: 'Daily Log', val: parsedData.dailyLogs.length  },
              { label: '인센티브',  val: parsedData.incentives.length },
              { label: '분기 블록', val: quarterlyCount               },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                  {val.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{label}</div>
              </div>
            ))}
            <div
              style={{
                marginLeft: 'auto',
                color: 'rgba(255,255,255,0.65)',
                fontSize: 12,
              }}
            >
              확인 후 '병합 임포트'를 눌러 적용하세요
            </div>
          </div>
        )}

        {/* 탭 본문 */}
        <Tabs
          items={tabItems}
          size="small"
          style={{ padding: '0 4px' }}
          tabBarStyle={{ marginBottom: 12 }}
        />
      </Modal>
    </>
  );
}
