'use client';

import { WarningOutlined } from '@ant-design/icons';
import { Button, Card, Result } from 'antd';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: 'Configuration Error',
      description: 'There is a problem with the server configuration.',
    },
    AccessDenied: {
      title: 'Access Denied',
      description: 'You do not have permission to access this application.',
    },
    Verification: {
      title: 'Verification Error',
      description: 'The verification link may have expired or already been used.',
    },
    Default: {
      title: 'Authentication Error',
      description: 'An error occurred during authentication. Please try again.',
    },
  };

  const { title, description } = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <Card style={{ width: 500 }}>
      <Result
        status="error"
        icon={<WarningOutlined />}
        title={title}
        subTitle={description}
        extra={[
          <Button type="primary" key="retry" href="/auth/signin">
            Try Again
          </Button>,
          <Button key="home" href="/">
            Go Home
          </Button>,
        ]}
      />
    </Card>
  );
}

export default function AuthErrorPage() {
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
      <Suspense fallback={
        <Card style={{ width: 500 }}>
          <Result
            status="error"
            icon={<WarningOutlined />}
            title="Authentication Error"
            subTitle="Loading error details..."
          />
        </Card>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
