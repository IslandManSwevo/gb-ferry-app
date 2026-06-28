'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function ComplianceAlertsPage() {
  return (
    <DashboardLayout contentClassName="p-6">
      <Card>
        <CardContent className="py-16 flex flex-col items-center gap-4">
          <Bell size={48} className="text-[rgba(51,255,51,0.15)]" aria-hidden />
          <h2 className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#33FF33]">
            Compliance Alerts Center
          </h2>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.45)] text-center max-w-sm">
            Real-time monitoring for regulatory violations and certificate expirations.
          </p>
          <p className="font-mono text-[10px] text-[rgba(51,255,51,0.3)] tracking-wider">
            — NO ACTIVE ALERTS — ALL SYSTEMS NOMINAL —
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
