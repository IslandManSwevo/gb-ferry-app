'use client';

import { canAccess } from '@/lib/auth/access';
import { useUserRoles } from '@/lib/auth/roles';
import {
  CheckCircleOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  FileProtectOutlined,
  GlobalOutlined,
  IdcardOutlined,
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

// Feature Flag Mapping
const FEATURE_MAP: Record<string, string> = {
  '/passengers/checkin': 'passengers.checkin',
  '/passengers/manifests': 'manifests.generate',
  '/passengers': 'passengers.view',
  '/crew': 'crew.view',
  '/crew/safe-manning': 'crew.manage',
  '/crew/certifications': 'certifications.view',
  '/vessels/documents': 'documents.upload',
  '/vessels': 'vessels.view',
  '/compliance/exports': 'compliance.export',
  '/compliance/reports': 'compliance.reports',
  '/compliance/inspections': 'inspections.manage',
  '/audit': 'audit.view',
  '/settings': 'settings.view',
};

const menuItems: MenuItem[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Command Center',
  },
  {
    key: '/passengers/checkin',
    icon: <CheckCircleOutlined />,
    label: 'Passenger Check-In',
  },
  {
    key: 'active-operations',
    icon: <DeploymentUnitOutlined />,
    label: 'Active Operations',
    children: [
      { key: '/passengers/manifests', label: 'Manifests' },
      { key: '/passengers', label: 'Passenger List' },
      { key: '/crew', label: 'Crew On Duty' },
    ],
  },
  {
    key: 'voyage-prep',
    icon: <IdcardOutlined />,
    label: 'Voyage Preparation',
    children: [
      { key: '/crew/safe-manning', label: 'Safe Manning' },
      { key: '/crew/certifications', label: 'Certifications' },
      { key: '/vessels/documents', label: 'Vessel Documents' },
    ],
  },
  {
    key: 'fleet-management',
    icon: <GlobalOutlined />,
    label: 'Fleet Management',
    children: [
      { key: '/vessels', label: 'Vessel Status' },
      { key: '/compliance/exports', label: 'Export Records' },
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
    key: 'system-management',
    icon: <SettingOutlined />,
    label: 'System Management',
    children: [
      { key: '/settings', label: 'Platform Settings' },
      { key: '/audit-management', keyPath: '/audit', label: 'High-Level Audit' } as any, // Dual access to audit
    ],
  },
];

const parentKeys = new Set(
  menuItems.filter(isMenuItemWithChildren).map((item) => String(item.key))
);

const matchesPath = (pathname: string, matcher: string) =>
  pathname === matcher || pathname.startsWith(`${matcher}/`);

function filterMenuItemsByRole(items: MenuItem[], roles: string[]): MenuItem[] {
  const recurse = (item: MenuItem): MenuItem | null => {
    if (!item) return null;
    if (isDividerItem(item)) return item;

    const key = (item as any).key;
    const realPath = (item as any).keyPath || key;

    // Check feature flag if defined
    if (FEATURE_MAP[realPath]) {
      if (!canAccess(roles, FEATURE_MAP[realPath])) {
        return null;
      }
    }

    if (isMenuItemWithChildren(item)) {
      const children = item.children.map(recurse).filter(Boolean) as MenuItem[];
      if (children.length === 0) return null; // Hide parent if no visible children
      return { ...item, children } as MenuItem;
    }

    return item;
  };

  return items.map(recurse).filter(Boolean) as MenuItem[];
}

function findOpenKeys(pathname: string): string[] {
  const mapping = [
    { key: 'active-operations', matchers: ['/passengers/manifests', '/passengers', '/crew'] },
    {
      key: 'voyage-prep',
      matchers: ['/crew/safe-manning', '/crew/certifications', '/vessels/documents'],
    },
    { key: 'fleet-management', matchers: ['/vessels', '/compliance/exports'] },
    { key: 'regulatory', matchers: ['/compliance/reports', '/compliance/inspections', '/audit'] },
    { key: 'system-management', matchers: ['/settings'] },
  ];

  for (const entry of mapping) {
    if (entry.matchers.some((m) => matchesPath(pathname, m))) {
      return [entry.key];
    }
  }
  return [];
}

export const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [openKeys, setOpenKeys] = useState<string[]>(findOpenKeys(pathname));
  const roles = useUserRoles();

  const filteredItems = React.useMemo(() => filterMenuItemsByRole(menuItems, roles), [roles]);

  useEffect(() => {
    setOpenKeys(findOpenKeys(pathname));
  }, [pathname]);

  const handleMenuClick: MenuProps['onClick'] = ({ key, item }) => {
    const targetKey = (item as any).props.keyPath || String(key);
    if (parentKeys.has(targetKey)) return;
    router.push(targetKey);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={260}
      theme="dark"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 1000,
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #1890ff 0%, #001529 100%)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileProtectOutlined style={{ color: '#fff', fontSize: 18 }} />
        </div>
        {!collapsed && (
          <div style={{ marginLeft: 12 }}>
            <Text strong style={{ color: '#fff', fontSize: 15, display: 'block', lineHeight: 1.2 }}>
              GB Ferry
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>OPS COMMAND</Text>
          </div>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[pathname]}
        openKeys={openKeys}
        onOpenChange={(keys) => setOpenKeys(keys as string[])}
        items={filteredItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0, marginTop: 8 }}
      />
    </Sider>
  );
};
