'use client';

import { Button, Result } from 'antd';
import { useSession } from 'next-auth/react';

export default function UnauthorizedPage() {
  const { data: session } = useSession();

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
      <Result
        status="403"
        title="403 - Access Denied"
        subTitle={`Sorry ${session?.user?.name || 'User'}, you don't have permission to access this page.`}
        extra={[
          <Button type="primary" key="home" href="/">
            Back to Dashboard
          </Button>,
        ]}
        style={{
          background: 'white',
          padding: 48,
          borderRadius: 16,
        }}
      />
    </div>
  );
}
