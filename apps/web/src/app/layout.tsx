import { AuthProvider } from '@/components/providers/AuthProvider';
import '@/styles/globals.css';
import { gbferryTheme } from '@/theme/antd-theme';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Grand Bahama Ferry | Maritime Compliance Platform',
  description: 'Crew Compliance & Regulatory Support Platform for Grand Bahama Ferry operations.',
  keywords: ['ferry', 'maritime', 'compliance', 'bahamas', 'crew', 'STCW', 'BMA'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body suppressHydrationWarning>
        <AuthProvider>
          <AntdRegistry>
            <ConfigProvider theme={gbferryTheme}>{children}</ConfigProvider>
          </AntdRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
