'use client';

import { canAccess, useUserRoles } from '@/lib/auth/roles';
import {
    AuditOutlined,
    DashboardOutlined,
    FileProtectOutlined,
    GlobalOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';

const { Sider } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/passengers',
    icon: <UserOutlined />,
    label: 'Passengers',
    children: [
      { key: '/passengers/checkin', label: 'Check-In' },
      { key: '/passengers', label: 'Passenger List' },
      { key: '/passengers/manifests', label: 'Manifests' },
    ],
  },
  {
    key: '/crew',
    icon: <TeamOutlined />,
    label: 'Crew Management',
    children: [
      { key: '/crew', label: 'Crew Roster' },
      { key: '/crew/certifications', label: 'Certifications' },
      { key: '/crew/safe-manning', label: 'Safe Manning' },
    ],
  },
  {
    key: '/vessels',
    icon: <GlobalOutlined />,
    label: 'Vessels',
    children: [
      { key: '/vessels', label: 'Registry' },
      { key: '/vessels/documents', label: 'Wet-Lease Docs' },
    ],
  },
  {
    key: '/compliance',
    icon: <SafetyCertificateOutlined />,
    label: 'Compliance',
    children: [
      { key: '/compliance/reports', label: 'Reports' },
      { key: '/compliance/exports', label: 'Export Center' },
      { key: '/compliance/inspections', label: 'Inspections' },
    ],
  },
  {
    key: '/audit',
    icon: <AuditOutlined />,
    label: 'Audit Log',
  },
  {
    type: 'divider',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Settings',
  },
];

function filterMenuItemsByRole(items: MenuItem[], roles: string[]): MenuItem[] {
  const roleList = roles as any;

  const allowKey = (key: string) => {
    if (key === '/' || key === '/settings') return true;
    if (key.startsWith('/passengers/checkin')) return canAccess(roleList, 'passengers.checkin');
    if (key.startsWith('/passengers/manifests')) return canAccess(roleList, 'passengers.view');
    if (key.startsWith('/passengers')) return canAccess(roleList, 'passengers.view');

    if (key.startsWith('/crew/certifications')) return canAccess(roleList, 'certifications.view');
    if (key.startsWith('/crew/safe-manning')) return canAccess(roleList, 'crew.view');
    if (key.startsWith('/crew')) return canAccess(roleList, 'crew.view');

    if (key.startsWith('/vessels')) return canAccess(roleList, 'vessels.view');

    if (key.startsWith('/compliance/reports')) return canAccess(roleList, 'compliance.reports');
    if (key.startsWith('/compliance/exports')) return canAccess(roleList, 'compliance.export');
    if (key.startsWith('/compliance/inspections')) return canAccess(roleList, 'inspections.manage');
    if (key.startsWith('/compliance')) return canAccess(roleList, 'compliance.dashboard');

    if (key.startsWith('/audit')) return canAccess(roleList, 'audit.view');

    return true;
  };

  const recurse = (item: MenuItem): MenuItem | null => {
    if (!item) return null;
    if (typeof item !== 'object' || !('key' in item)) return item;

    const key = String((item as any).key);

    if ((item as any).children) {
      const children = ((item as any).children as MenuItem[])
        .map(recurse)
        .filter(Boolean) as MenuItem[];

      if (!allowKey(key) && children.length === 0) {
        return null;
      }

      return { ...(item as any), children } as MenuItem;
    }

    return allowKey(key) ? item : null;
  };

  return items.map(recurse).filter(Boolean) as MenuItem[];
}

// Helper to find parent key for a given path
function findOpenKeys(pathname: string): string[] {
  const parentRoutes = ['/passengers', '/crew', '/vessels', '/compliance'];
  for (const parent of parentRoutes) {
    if (pathname.startsWith(parent)) {
      return [parent];
    }
  }
  return [];
}

export const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const roles = useUserRoles();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    router.push(key);
  };

  const selectedKeys = [pathname];
  const defaultOpenKeys = findOpenKeys(pathname);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={260}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={() => router.push('/')}
        >
          <FileProtectOutlined style={{ color: '#fff', fontSize: 18 }} />
        </div>
        {!collapsed && (
          <div style={{ marginLeft: 12, cursor: 'pointer' }} onClick={() => router.push('/')}>
            <Text strong style={{ color: '#fff', fontSize: 16, display: 'block', lineHeight: 1.2 }}>
              GB Ferry
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
              Compliance Platform
            </Text>
          </div>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={defaultOpenKeys}
        items={filterMenuItemsByRole(menuItems, roles)}
        onClick={handleMenuClick}
        style={{ borderRight: 0, marginTop: 8 }}
      />
    </Sider>
  );
};
