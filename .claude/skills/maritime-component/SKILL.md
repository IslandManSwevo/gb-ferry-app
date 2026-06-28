---
name: maritime-component
description: Scaffolds a new UI component for the GB Ferry Maritime Ops Command Center following the Industrial Brutalist / Tactical Telemetry design system. Usage: /maritime-component ComponentName [description of what it does]
---

# Maritime Component Generator

You are creating a new React component for the GB Ferry Maritime Ops Command Center.
The component MUST follow the Industrial Brutalist design system exactly.

## Before You Start

Run the `think-first` skill to understand the context and check for existing reusable components.

## Component Template

Generate a `.tsx` file at `apps/web/src/components/[category]/[ComponentName].tsx` following this structure:

```tsx
'use client';

import { cn } from '@/lib/utils'; // if shadcn cn utility is available
// Import only Lucide React icons — no Ant Design icons

interface [ComponentName]Props {
  // Props here
}

export function [ComponentName]({ ...props }: [ComponentName]Props) {
  return (
    // All wrapper divs use: border border-[#33FF33]/20 bg-[#050505]
    // NO rounded corners — rounded-none on everything
    // Data values in font-mono class
    // Spacing: multiples of 8px (p-8, p-4, gap-4, gap-8, etc.)
  );
}
```

## Design System Checklist (apply to every element)

### Colors
| What | Class / Value |
|---|---|
| Page/card background | `bg-[#050505]` |
| Primary actions / active | `text-[#33FF33]` or `border-[#33FF33]` |
| Error / critical alert | `text-[#FF4B2B]` |
| Data / telemetry values | `text-[#00FFFF]` |
| Caution / secondary | `text-[#FFB000]` |
| Borders | `border border-[#33FF33]/20` |
| Muted text | `text-white/60` |

### Typography
- Navigation labels, headings: `font-sans uppercase tracking-tight font-bold`
- **ALL data values, IDs, codes, timestamps, numbers**: `font-mono text-[#00FFFF]`
- Section headers: `text-xs font-mono tracking-widest uppercase text-white/50`

### Structure (MANDATORY)
```
rounded-none     ← every element, no exceptions
border-0 → use border with explicit color instead
p-4 / p-8       ← 8px grid (4px = p-1, 8px = p-2, 16px = p-4, 32px = p-8)
```

### PROHIBITED — Claude will reject components with these
- `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`, any `border-radius`
- `shadow-*` (box shadows)
- `bg-gradient-*` or any gradient
- `backdrop-blur`
- Ant Design imports (`antd`, `@ant-design/*`)
- Non-Lucide icons

## After Generating

Invoke the `maritime-design-reviewer` agent to verify the component before reporting completion. Only mark the task done if the reviewer returns PASS.
