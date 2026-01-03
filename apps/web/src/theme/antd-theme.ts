import type { ThemeConfig } from 'antd';

/**
 * Grand Bahama Ferry Ant Design Theme
 * Maritime-inspired color palette with enterprise credibility
 */
export const gbferryTheme: ThemeConfig = {
  token: {
    // Primary colors - Maritime Blue
    colorPrimary: '#0a4d8c',
    colorPrimaryHover: '#1677ff',
    colorPrimaryActive: '#003a70',

    // Success - Compliance Green
    colorSuccess: '#52c41a',

    // Warning - Attention Amber
    colorWarning: '#faad14',

    // Error - Alert Red
    colorError: '#ff4d4f',

    // Info - Ocean Blue
    colorInfo: '#1890ff',

    // Background colors
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f0f2f5',

    // Text colors
    colorText: '#262626',
    colorTextSecondary: '#8c8c8c',

    // Border
    colorBorder: '#d9d9d9',
    borderRadius: 8,

    // Typography
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,

    // Sizing
    controlHeight: 40,
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#ffffff',
      bodyBg: '#f0f2f5',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
      darkItemSelectedBg: '#0a4d8c',
    },
    Button: {
      primaryShadow: '0 2px 8px rgba(10, 77, 140, 0.35)',
    },
    Card: {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    Table: {
      headerBg: '#fafafa',
      rowHoverBg: '#f0f7ff',
    },
  },
};
