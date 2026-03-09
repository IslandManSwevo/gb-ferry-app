# UI Component Inventory - Web (web)

## Overview
The frontend is built with Next.js 14 (App Router) using Ant Design (v5) as the primary UI library. The theme is customized for a "Maritime Dark" aesthetic.

## Layout Components
- **AppSidebar**: Main navigation with role-based menu filtering.
- **AppHeader**: Global header with user profile and notifications.
- **AppFooter**: Optional platform footer.

## UI Elements (`src/components/ui`)
- **StatusBadge**: Multi-state tag (`ok`, `warning`, `critical`, `info`, `muted`) for compliance and status tracking.
- **CrewManningIndicator**: Visual representation of safe manning levels.
- **DepartureCountdown**: Real-time timer for upcoming vessel departures.
- **GlassCard**: Semi-transparent card with backdrop blur for dashboard widgets.
- **WeatherWidget**: Local weather and maritime advisories.
- **MaritimeStyles**: Shared styled-components or CSS configurations.

## Feature-Specific Components
- **vessels/VesselCard**: Compact vessel summary.
- **compliance/VesselReadinessList**: Dashboard list of vessels and their compliance status.
- **compliance/PriorityStatCard**: High-impact metrics (Blocking, Critical, Warning).

## Design System
- **Library**: Ant Design (v5).
- **Icons**: `@ant-design/icons`.
- **Typography**: Ant Design Typography (`Title`, `Text`).
- **Styling**: Vanilla CSS + Emotion (via Ant Design) + inline styles.
- **Colors**:
  - Primary: `#1890ff` (Blue)
  - Success: `#52c41a` (Green)
  - Warning: `#faad14` (Gold)
  - Error/Blocking: `#ff4d4f` (Red)
  - Background: Deep Dark Blue (`#0a1f33` to `#0b3a5d`).
