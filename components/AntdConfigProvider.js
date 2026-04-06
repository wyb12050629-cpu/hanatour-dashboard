'use client';

import { ConfigProvider, App } from 'antd';
import koKR from 'antd/locale/ko_KR';

export default function AntdConfigProvider({ children }) {
  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        token: {
          colorPrimary: '#0054A6',
          fontFamily:
            "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          borderRadius: 8,
          colorBgContainer: '#ffffff',
        },
        components: {
          Layout: {
            headerBg: 'transparent',
            siderBg: '#ffffff',
          },
          Menu: {
            itemSelectedBg: '#e6f0ff',
            itemSelectedColor: '#0054A6',
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
