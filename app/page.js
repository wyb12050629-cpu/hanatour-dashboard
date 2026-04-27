'use client';

/**
 * app/page.js
 * 하나투어 영업·인센티브 통합 관리 — 히어로 랜딩 페이지
 */

import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useRouter } from 'next/navigation';
import { getCurrentWeekRange, generateWeekOptions } from '@/lib/store';

dayjs.locale('ko');

const WEEK_OPTIONS = generateWeekOptions(dayjs().year());

export default function Home() {
  const router = useRouter();
  const today = dayjs();
  const { start, end } = getCurrentWeekRange();

  // 현재 주차 라벨
  const weekLabel = WEEK_OPTIONS.find((w) => w.value === start.format('YYYY-MM-DD'))?.label
    || `${start.format('M/D')}~${end.format('M/D')}`;

  const navTo = (tab) => router.push(`/dashboard?tab=${tab}`);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F6FC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 32px',
    }}>
      <div style={{ maxWidth: 960, width: '100%' }}>

        {/* ── 히어로 카드 ── */}
        <div
          className="hero-card"
          style={{
            borderRadius: 20,
            background: 'linear-gradient(135deg, #5C2D91 0%, #7B3DB5 50%, #00B4C8 100%)',
            padding: '48px 56px',
            boxShadow: '0 20px 60px rgba(92, 45, 145, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 40,
            flexWrap: 'wrap',
            animation: 'fadeInUp 0.5s ease',
          }}
        >
          {/* 좌측 */}
          <div className="hero-left" style={{ flex: 1, minWidth: 280, animation: 'slideInLeft 0.6s ease' }}>
            {/* 배지 */}
            <span className="hero-badge" style={{
              display: 'inline-block',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%)',
              backgroundSize: '200% auto',
              animation: 'shimmer 3s linear infinite',
              color: '#fff',
              fontSize: 11,
              letterSpacing: 3,
              borderRadius: 20,
              padding: '4px 12px',
              marginBottom: 20,
            }}>
              HANATOUR
            </span>

            <div style={{ color: '#fff', fontSize: 28, fontWeight: 300, lineHeight: 1.3 }}>
              영업·인센티브
            </div>
            <div style={{ color: '#fff', fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              통합 관리 시스템
            </div>

            {/* 구분선 */}
            <div style={{ width: 60, height: 1, background: 'rgba(255,255,255,0.3)', marginBottom: 16 }} />

            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 4 }}>
              담당자 · 영업2팀 김기웅
            </div>
            <span className="bon-courage">
              ✦ 오늘 하루도 bon courage!
            </span>

            {/* 빠른 이동 버튼 */}
            <div style={{ display: 'flex', gap: 10, marginTop: 32, flexWrap: 'wrap' }}>
              {[
                { emoji: '🏢', label: '대리점', tab: 'agency' },
                { emoji: '📋', label: '견적', tab: 'pipeline' },
                { emoji: '💰', label: '인센티브', tab: 'incentive' },
              ].map(({ emoji, label, tab }) => (
                <button
                  key={tab}
                  onClick={() => navTo(tab)}
                  className="hero-nav-btn"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          {/* 우측 */}
          <div className="hero-right" style={{
            textAlign: 'right',
            flexShrink: 0,
            minWidth: 180,
            animation: 'slideInRight 0.6s ease 0.15s both',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 4 }}>
              {today.format('dddd')}
            </div>
            <div style={{ color: '#fff', fontSize: 48, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1 }}>
              {today.format('MM. DD')}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
              {weekLabel}
            </div>
            {/* 시안 포인트 도형 */}
            <div style={{
              width: 80,
              height: 4,
              background: '#00B4C8',
              borderRadius: 2,
              marginLeft: 'auto',
              marginTop: 16,
            }} />
          </div>
        </div>

        {/* ── 하단 CTA ── */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={() => router.push('/dashboard')}
            className="hero-cta-btn"
            style={{
              background: '#5C2D91',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 32px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(92,45,145,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7B3DB5';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#5C2D91';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            대시보드 전체 보기 →
          </button>
          <div style={{ color: '#6B6B8A', fontSize: 12, marginTop: 10 }}>
            대리점 · 견적 · 인센티브 · 달력 · 로그 관리
          </div>
        </div>

        {/* ── 애니메이션 CSS ── */}
        <style jsx global>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-30px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(30px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes shimmer {
            0%   { background-position: -400% center; }
            100% { background-position:  400% center; }
          }
          .bon-courage {
            font-style: italic;
            font-size: 15px;
            font-weight: 500;
            background: linear-gradient(
              90deg,
              rgba(255,255,255,0.5) 0%,
              rgba(255,255,255,1)   30%,
              rgba(0,180,200,1)     50%,
              rgba(255,255,255,1)   70%,
              rgba(255,255,255,0.5) 100%
            );
            background-size: 300% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer 7.5s linear infinite;
            display: inline-block;
          }
        `}</style>
      </div>
    </div>
  );
}
