import { AntdRegistry } from '@ant-design/nextjs-registry';
import AntdConfigProvider from '@/components/AntdConfigProvider';
import './globals.css';

export const metadata = {
  title: '하나투어 영업/인센티브 통합 대시보드',
  description: '하나투어 영업 및 인센티브 통합 관리 대시보드',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <AntdRegistry>
          <AntdConfigProvider>{children}</AntdConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
