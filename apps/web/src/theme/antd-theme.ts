import type { ThemeConfig } from 'antd';

/**
 * Grand Bahama Ferry Ant Design Theme
 * Maritime-inspired palette with operational status semantics
 */
export const gbferryTheme: ThemeConfig = {
  token: {
    // Primary maritime palette
    colorPrimary: '#0077be', // ocean blue
    colorPrimaryHover: '#1890ff',
    colorPrimaryActive: '#003f5c', // deep sea

    // Semantic statuses
    colorSuccess: '#52c41a', // safety green
    colorWarning: '#ff6b35', // weather warning
    colorError: '#ff4d4f', // critical
    colorInfo: '#00c9a7', // turquoise info

    // Backgrounds / glass surfaces
    colorBgContainer: 'rgba(255,255,255,0.82)',
    colorBgLayout: '#e6f2ff',
    colorFillAlter: 'rgba(255,255,255,0.45)',

    // Text colors
    colorText: '#0f172a',
    colorTextSecondary: '#475569',

    // Border
    colorBorder: '#d0d7e2',
    borderRadius: 10,

    // Typography
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,

    // Sizing
    controlHeight: 40,
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: 'rgba(255,255,255,0.9)',
      bodyBg: '#e6f2ff',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
      darkItemSelectedBg: '#003f5c',
    },
    Button: {
      primaryShadow: '0 10px 30px rgba(0, 119, 190, 0.3)',
    },
    Card: {
      boxShadow: '0 12px 40px rgba(0, 63, 92, 0.14)',
    },
    Table: {
      headerBg: '#f5fbff',
      rowHoverBg: '#f0f7ff',
    },
  },
};
