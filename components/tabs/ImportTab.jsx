'use client';

import { Typography, Space, Divider, Tag } from 'antd';
import { ImportOutlined, SafetyOutlined, DatabaseOutlined } from '@ant-design/icons';
import ExcelImporter from '@/components/ExcelImporter';

/**
 * 데이터 임포트 탭
 * ExcelImporter 컴포넌트를 래핑하고 사용 안내를 함께 표시합니다.
 *
 * @param {{ onImport: (data: object) => void }} props
 */
export default function ImportTab({ onImport }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      {/* 탭 헤더 */}
      <Space style={{ marginBottom: 20 }}>
        <ImportOutlined style={{ fontSize: 28, color: '#0054A6' }} />
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: '#0054A6' }}>
            데이터 임포트
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            엑셀 파일을 업로드하면 기존 데이터와 자동으로 병합됩니다.
          </Typography.Text>
        </div>
      </Space>

      {/* 업로드 컴포넌트 */}
      <ExcelImporter onImport={onImport} />

      <Divider style={{ margin: '28px 0 20px' }} />

      {/* 사용 안내 */}
      <div
        style={{
          background: '#f8fbff',
          border: '1px solid #d6e4f5',
          borderRadius: 10,
          padding: '16px 20px',
        }}
      >
        <Space style={{ marginBottom: 12 }}>
          <SafetyOutlined style={{ color: '#52c41a' }} />
          <Typography.Text strong style={{ fontSize: 13 }}>
            파일 처리 방식 안내
          </Typography.Text>
        </Space>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          {[
            '파일은 브라우저 내에서만 처리되며, 서버로 전송되지 않습니다.',
            '동일한 키(대리점코드 / 견적번호 / 날짜+대리점+상품코드)의 데이터는 병합(upsert)됩니다.',
            '지원 시트: Agency_Overview · 견적정리 · Daily_Log · 인센정리 · 출발일관리 · 2~4분기',
            '날짜 컬럼은 엑셀 시리얼 숫자와 문자열 모두 자동 변환됩니다.',
            '파싱 후 미리보기에서 데이터를 확인한 다음 "병합 임포트"를 클릭하세요.',
          ].map((text) => (
            <li key={text}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {text}
              </Typography.Text>
            </li>
          ))}
        </ul>
      </div>

      {/* 지원 파일 형식 */}
      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <DatabaseOutlined style={{ color: '#8a9bb0', marginTop: 2 }} />
        {[
          '대리점관리_HI327.xlsx',
          '2026_인센티브_관리.xlsx',
        ].map((name) => (
          <Tag key={name} color="geekblue" icon={<DatabaseOutlined />}>
            {name}
          </Tag>
        ))}
      </div>
    </div>
  );
}
