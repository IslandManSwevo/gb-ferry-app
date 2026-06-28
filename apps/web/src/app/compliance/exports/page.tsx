'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { termInputCls } from '@/components/ui/TerminalModal';
import { api } from '@/lib/api';
import {
  CheckCircle,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Vessel { id: string; name: string; imoNumber?: string; }
interface RecentExport { vesselName: string; format: string; timestamp: string; }

const EXPORT_TYPES = [
  {
    key: 'crew-compliance',
    title: 'Crew Compliance Pack',
    description:
      'Full crew roster with certification status, safe manning validation, and medical certificate compliance. Suitable for regulatory submission.',
    icon: Users,
    formats: ['json', 'csv'] as const,
    regulatory: 'BMA R106 / STCW',
    comingSoon: false,
  },
  {
    key: 'cbp-crew-list',
    title: 'CBP Crew List (I-418)',
    description:
      'Crew data formatted for US Customs and Border Protection Form I-418 submission via the ACE portal.',
    icon: FileText,
    formats: ['json'] as const,
    regulatory: 'CBP / APIS',
    comingSoon: true,
  },
  {
    key: 'audit-trail',
    title: 'Compliance Audit Trail',
    description:
      'Complete audit log export for Port State Control inspections and ISO 27001 evidence collection.',
    icon: ShieldCheck,
    formats: ['csv'] as const,
    regulatory: 'ISO 27001 / PSC',
    comingSoon: true,
  },
];

export default function ExportCenterPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVessel, setSelectedVessel] = useState('');
  const [loadingVessels, setLoadingVessels] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [recentExports, setRecentExports] = useState<RecentExport[]>([]);

  const fetchVessels = useCallback(async () => {
    setLoadingVessels(true);
    const { data } = await api.vessels.list({ pageSize: 100 });
    if (data?.items) {
      setVessels(data.items);
      if (data.items.length > 0) setSelectedVessel(data.items[0].id);
    }
    setLoadingVessels(false);
  }, []);

  useEffect(() => { fetchVessels(); }, [fetchVessels]);

  async function handleExport(format: 'csv' | 'json') {
    if (!selectedVessel) return;
    setExportingFormat(format);
    try {
      const { data } = await api.compliance.exportCrewCompliance(selectedVessel, format);
      if (data) {
        const blob = data instanceof Blob ? data : new Blob([data as any]);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const vessel = vessels.find((v) => v.id === selectedVessel);
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        link.href = url;
        link.download = `crew-compliance-${vessel?.name?.replace(/\s+/g, '_') || selectedVessel}-${ts}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setRecentExports((prev) => [
          { vesselName: vessel?.name ?? selectedVessel, format: format.toUpperCase(), timestamp: new Date().toLocaleTimeString() },
          ...prev.slice(0, 4),
        ]);
      }
    } catch (_) {}
    setExportingFormat(null);
  }

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#00F2FE] font-semibold flex items-center gap-2">
            <Upload size={16} aria-hidden />
            Export Center
          </h1>
          <p className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">
            Generate regulatory-compliant exports for BMA, CBP, and audit purposes
          </p>
        </div>
      </div>

      {/* Vessel selector */}
      <Card className="mb-6">
        <CardContent className="py-3 flex items-center gap-4">
          <span className="font-mono text-[11px] text-[rgba(0,242,254,0.5)] flex-shrink-0">TARGET VESSEL:</span>
          {loadingVessels ? (
            <div className="w-4 h-4 border border-[#00F2FE] border-t-transparent animate-spin" />
          ) : (
            <select
              className={`${termInputCls} w-72`}
              value={selectedVessel}
              onChange={(e) => setSelectedVessel(e.target.value)}
            >
              {vessels.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#0B132B]">
                  {v.name}{v.imoNumber ? ` (IMO: ${v.imoNumber})` : ''}
                </option>
              ))}
            </select>
          )}
          {selectedVessel && (
            <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)] tracking-widest">
              {vessels.find((v) => v.id === selectedVessel)?.name ?? 'SELECTED'}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Export type cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {EXPORT_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <div key={type.key} className="border border-[rgba(0,242,254,0.15)] bg-[#0B132B] p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 border border-[rgba(0,242,254,0.2)] bg-[rgba(0,242,254,0.04)] flex items-center justify-center flex-shrink-0">
                  <Icon size={22} className="text-[rgba(0,242,254,0.5)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[12px] text-[rgba(0,242,254,0.8)] font-semibold">{type.title}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)] tracking-widest w-fit">
                    {type.regulatory}
                  </span>
                </div>
              </div>

              <p className="font-mono text-[11px] text-[rgba(0,242,254,0.45)] leading-relaxed flex-1">
                {type.description}
              </p>

              {type.comingSoon ? (
                <div className="border border-dashed border-[rgba(0,242,254,0.15)] text-center py-2">
                  <span className="font-mono text-[10px] text-[rgba(0,242,254,0.3)] tracking-widest">
                    COMING IN PHASE 3
                  </span>
                </div>
              ) : (
                <div className="flex gap-2">
                  {type.formats.map((format) => (
                    <Button
                      key={format}
                      size="sm"
                      variant={format === 'json' ? 'primary' : 'ghost'}
                      icon={
                        exportingFormat === format
                          ? <div className="w-3 h-3 border border-current border-t-transparent animate-spin" />
                          : format === 'csv'
                          ? <FileSpreadsheet size={11} />
                          : <FileJson size={11} />
                      }
                      onClick={() => handleExport(format as 'csv' | 'json')}
                      disabled={!selectedVessel || exportingFormat !== null}
                    >
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent exports */}
      <Card>
        <CardHeader>
          <span className="flex items-center gap-2">
            <Download size={13} />
            RECENT EXPORTS (THIS SESSION)
          </span>
        </CardHeader>
        <CardContent>
          {recentExports.length === 0 ? (
            <p className="font-mono text-[11px] text-[rgba(0,242,254,0.25)] text-center py-8 tracking-widest">
              — NO EXPORTS YET. SELECT A VESSEL ABOVE AND CHOOSE A FORMAT —
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentExports.map((exp, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 border border-[rgba(0,242,254,0.06)] bg-[rgba(0,242,254,0.02)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={12} className="text-[#00F2FE]" />
                    <span className="font-mono text-[11px] text-[rgba(0,242,254,0.7)]">
                      {exp.vesselName} — Crew Compliance Pack
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)]">
                      {exp.format}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[rgba(0,242,254,0.35)] tabular-nums">{exp.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
