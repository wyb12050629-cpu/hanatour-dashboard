import { Suspense } from 'react';
import DashboardContent from '@/components/DashboardContent';

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f4f8',
        color: '#5C2D91',
        fontSize: 16,
      }}>
        대시보드 로딩 중...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
