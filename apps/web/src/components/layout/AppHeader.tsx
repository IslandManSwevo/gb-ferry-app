'use client';

import {
  AlertOutlined,
  BellOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Badge, Button, Dropdown, Layout, Skeleton, Space, Typography } from 'antd';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react';

const { Header } = Layout;
const { Text } = Typography;

export const AppHeader: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'profile':
        router.push('/settings');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'logout':
        signOut({ callbackUrl: '/auth/signin' });
        break;
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Account Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
    },
  ];

  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || '';
  const userRoles = session?.user?.roles || [];
  const primaryRole = userRoles[0] || 'Staff';

  // Format role for display
  const displayRole = primaryRole
    .split('_')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Left section */}
      <div>
        <Text type="secondary">
          Today:{' '}
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </div>

      {/* Right section */}
      <Space size="middle">
        <Button
          danger
          type="primary"
          icon={<AlertOutlined />}
          onClick={() => router.push('/emergency')}
          style={{ fontWeight: 600 }}
        >
          Emergency
        </Button>

        <Button type="text" icon={<QuestionCircleOutlined />} aria-label="Help" />

        <Badge count={3} size="small">
          <Button type="text" icon={<BellOutlined />} aria-label="Notifications" />
        </Badge>

        {status === 'loading' ? (
          <Space>
            <Skeleton.Avatar active size="default" />
            <Skeleton.Input active size="small" style={{ width: 100 }} />
          </Space>
        ) : (
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleMenuClick }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#0a4d8c' }} icon={<UserOutlined />} />
              <div style={{ lineHeight: 1.2 }}>
                <Text strong style={{ display: 'block', fontSize: 13 }}>
                  {userName}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {userEmail || displayRole}
                </Text>
              </div>
            </Space>
          </Dropdown>
        )}
      </Space>
    </Header>
  );
};
