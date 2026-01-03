import { AuthProvider } from '@/components/providers/AuthProvider';
import '@/styles/globals.css';
import { gbferryTheme } from '@/theme/antd-theme';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grand Bahama Ferry | Maritime Compliance Platform',
  description:
    'Maritime Passenger & Compliance Support Platform for Grand Bahama Ferry operations.',
  keywords: ['ferry', 'maritime', 'compliance', 'bahamas', 'passenger manifest'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AntdRegistry>
            <ConfigProvider theme={gbferryTheme}>{children}</ConfigProvider>
          </AntdRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
