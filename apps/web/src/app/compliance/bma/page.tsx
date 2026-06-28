'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function BmaEndorsementsPage() {
  return (
    <DashboardLayout contentClassName="p-6">
      <Card>
        <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
          <ShieldCheck size={48} className="text-[rgba(0,242,254,0.15)]" aria-hidden />
          <h2 className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#00F2FE]">
            BMA Endorsements Manager
          </h2>
          <p className="font-mono text-[11px] text-[rgba(0,242,254,0.45)] max-w-sm">
            This module is used for tracking Bahamas Maritime Authority specific endorsements.
          </p>
          <p className="font-mono text-[10px] text-[rgba(0,242,254,0.3)] tracking-wider">
            — CURRENTLY INTEGRATED WITH THE MAIN CERTIFICATIONS REGISTRY —
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
