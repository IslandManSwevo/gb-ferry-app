'use client';

import { LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Result, Space, Spin, Typography } from 'antd';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const { Title, Text } = Typography;

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  if (status === 'loading') {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (session) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
        }}
      >
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Result
              icon={<UserOutlined style={{ fontSize: 48, color: '#52c41a' }} />}
              title={`Welcome, ${session.user?.name}`}
              subTitle={session.user?.email}
            />
            <Text type="secondary">Roles: {session.user?.roles?.join(', ') || 'None'}</Text>
            <Space>
              <Button type="primary" href="/">
                Go to Dashboard
              </Button>
              <Button
                icon={<LogoutOutlined />}
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              >
                Sign Out
              </Button>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Redirecting to your destination...
            </Text>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
      }}
    >
      <Card style={{ width: 400, textAlign: 'center' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <div
              style={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <span style={{ fontSize: 32 }}>🚢</span>
            </div>
            <Title level={3} style={{ marginBottom: 8 }}>
              Grand Bahama Ferry
            </Title>
            <Text type="secondary">Maritime Compliance Platform</Text>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            onClick={() => signIn('keycloak', { callbackUrl: '/' })}
            block
          >
            Sign in with Keycloak
          </Button>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Enterprise Single Sign-On
          </Text>

          <Text type="secondary" style={{ fontSize: 11, marginTop: 8 }}>
            If sign-in doesn&apos;t work, open in a real browser:{' '}
            <a href="http://localhost:3000/auth/signin" target="_blank" rel="noopener noreferrer">
              localhost:3000
            </a>
          </Text>
        </Space>
      </Card>
    </div>
  );
}
