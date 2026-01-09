'use client';

import { useUserRoles } from '@/lib/auth/roles';
import {
  CheckCircleOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const { Sider } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

type MenuItemWithChildren = Extract<MenuItem, { key: React.Key; children: MenuItem[] }>;

const isMenuItemWithChildren = (item: MenuItem): item is MenuItemWithChildren =>
  !!item &&
  typeof item === 'object' &&
  'children' in item &&
  Array.isArray((item as { children?: unknown }).children) &&
  'key' in item;

const isDividerItem = (item: MenuItem): item is Extract<MenuItem, { type: 'divider' }> =>
  !!item &&
  typeof item === 'object' &&
  'type' in item &&
  (item as { type?: string }).type === 'divider';

const menuItems: MenuItem[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: "Today's Operations",
  },
  {
    key: '/passengers/checkin',
    icon: <CheckCircleOutlined />,
    label: 'Check-In Now',
  },
  {
    key: 'operations',
    icon: <GlobalOutlined />,
    label: 'Operations & Boarding',
    children: [
      { key: '/passengers/manifests', label: 'Manifests' },
      { key: '/crew', label: 'Crew On Duty' },
      { key: '/vessels', label: 'Fleet Status' },
    ],
  },
  {
    key: 'voyage-prep',
    icon: <CheckCircleOutlined />,
    label: 'Voyage Preparation',
    children: [
      { key: '/crew/safe-manning', label: 'Safe Manning' },
      { key: '/crew/certifications', label: 'Certifications' },
      { key: '/vessels/documents', label: 'Vessel Documents' },
    ],
  },
  {
    key: 'regulatory',
    icon: <SafetyCertificateOutlined />,
    label: 'Regulatory & Compliance',
    children: [
      { key: '/compliance/reports', label: 'Compliance Reports' },
      { key: '/compliance/inspections', label: 'Inspection Readiness' },
      { key: '/audit', label: 'Audit Log' },
    ],
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

const parentKeys = new Set(
  menuItems.filter(isMenuItemWithChildren).map((item) => String(item.key))
);

const matchesPath = (pathname: string, matcher: string) =>
  pathname === matcher || pathname.startsWith(`${matcher}/`);

function filterMenuItemsByRole(items: MenuItem[], roles: string[]): MenuItem[] {
  // Temporarily show all items regardless of role for debugging navigation
  // TODO: Restore role filtering once navigation is confirmed working
  const recurse = (item: MenuItem): MenuItem | null => {
    if (!item) return null;
    if (typeof item !== 'object') return item;
    if (isDividerItem(item)) return item;

    if (isMenuItemWithChildren(item)) {
      const children = item.children.map(recurse).filter(Boolean) as MenuItem[];
      return { ...item, children } as MenuItem;
    }

    return item;
  };

  return items.map(recurse).filter(Boolean) as MenuItem[];
}

// Helper to find parent key for a given path
function findOpenKeys(pathname: string): string[] {
  const mapping: { key: string; matchers: string[] }[] = [
    { key: 'operations', matchers: ['/passengers', '/crew', '/vessels'] },
    {
      key: 'voyage-prep',
      matchers: ['/crew/safe-manning', '/crew/certifications', '/vessels/documents'],
    },
    { key: 'regulatory', matchers: ['/compliance', '/audit'] },
  ];

  for (const entry of mapping) {
    if (entry.matchers.some((m) => matchesPath(pathname, m))) {
      return [entry.key];
    }
  }

  return [];
}

function extractRouteKeys(items: MenuItem[]): string[] {
  const keys: string[] = [];

  const visit = (item: MenuItem) => {
    if (!item || typeof item !== 'object') return;
    if (isDividerItem(item)) return;

    if ('key' in item) {
      const key = String((item as { key?: React.Key }).key ?? '');
      if (key.startsWith('/')) {
        keys.push(key);
      }
    }

    if (isMenuItemWithChildren(item)) {
      item.children.forEach(visit);
    }
  };

  items.forEach(visit);
  return keys;
}

const routeKeys = extractRouteKeys(menuItems);

export const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [openKeys, setOpenKeys] = useState<string[]>(findOpenKeys(pathname));
  const roles = useUserRoles();

  useEffect(() => {
    setOpenKeys(findOpenKeys(pathname));
  }, [pathname]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const targetKey = String(key);

    if (parentKeys.has(targetKey)) {
      setOpenKeys((prev) =>
        prev.includes(targetKey) ? prev.filter((k) => k !== targetKey) : [...prev, targetKey]
      );
      return;
    }

    router.push(targetKey);
  };

  const normalizeSelectedKey = (path: string) => {
    return routeKeys.find((k) => matchesPath(path, k)) || path;
  };

  const selectedKeys = [normalizeSelectedKey(pathname)];

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
        openKeys={openKeys}
        onOpenChange={(keys) => setOpenKeys(keys as string[])}
        items={filterMenuItemsByRole(menuItems, roles)}
        onClick={handleMenuClick}
        style={{ borderRight: 0, marginTop: 8 }}
      />
    </Sider>
  );
};
