'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TerminalModal, Field, SelectField, termInputCls } from '@/components/ui/TerminalModal';
import { api } from '@/lib/api/client';
import {
  AlertTriangle,
  Cloud,
  Phone,
  Radio,
  ShieldAlert,
  Shield,
  Users,
  Waves,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/* ── SOP card ─────────────────────────────────────────────── */
function SopCard({ title, steps, accent = 'vermilion' }: { title: string; steps: string[]; accent?: 'vermilion' | 'cyan' }) {
  const color = accent === 'cyan' ? '#00FFFF' : '#FF4B2B';
  const border = accent === 'cyan' ? 'rgba(0,255,255,0.2)' : 'rgba(255,75,43,0.2)';
  const bg = accent === 'cyan' ? 'rgba(0,255,255,0.03)' : 'rgba(255,75,43,0.03)';
  return (
    <div className="border p-4 flex flex-col gap-2" style={{ borderColor: border, background: bg }}>
      <p className="font-mono text-[11px] tracking-[0.1em] uppercase font-semibold" style={{ color }}>{title}</p>
      <ol className="flex flex-col gap-1">
        {steps.map((s, i) => (
          <li key={i} className="font-mono text-[11px] text-[rgba(51,255,51,0.55)] flex gap-2">
            <span className="tabular-nums text-[rgba(51,255,51,0.3)] flex-shrink-0">{i + 1}.</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── Incident form ───────────────────────────────────────── */
interface IncidentForm {
  incidentType: string;
  severity: string;
  location: string;
  description: string;
}
const INITIAL_INCIDENT: IncidentForm = { incidentType: '', severity: '', location: '', description: '' };

/* ── Page ─────────────────────────────────────────────────── */
export default function EmergencyPage() {
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<any | null>(null);
  const [crew, setCrew] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<IncidentForm>(INITIAL_INCIDENT);
  const [errors, setErrors] = useState<Partial<IncidentForm>>({});
  const [feed, setFeed] = useState([
    { id: '1', time: '10:45 AM', type: 'System', message: 'Manual emergency protocol activated' },
    { id: '2', time: '10:42 AM', type: 'Weather', message: 'Small craft advisory issued for Northwest Bahamas' },
  ]);

  const loadCrew = useCallback(async () => {
    const { data } = await api.crew.list();
    if (data) setCrew(data?.items ?? []);
  }, []);

  useEffect(() => { loadCrew(); }, [loadCrew]);

  function field(key: keyof IncidentForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate(): boolean {
    const e: Partial<IncidentForm> = {};
    if (!form.incidentType) e.incidentType = 'Required';
    if (!form.severity) e.severity = 'Required';
    if (!form.location) e.location = 'Required';
    if (!form.description) e.description = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleDeclare() {
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setFeed((prev) => [
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'Incident',
        message: `Reported: ${form.incidentType.replace(/_/g, ' ')} at ${form.location}`,
      },
      ...prev,
    ]);
    setSubmitting(false);
    setIncidentOpen(false);
    setForm(INITIAL_INCIDENT);
    setErrors({});
  }

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#FF4B2B] font-semibold flex items-center gap-2">
            <ShieldAlert size={16} aria-hidden />
            Emergency Operations Hub
          </h1>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">
            Command center for time-critical maritime incidents and fleet safety
          </p>
        </div>
        <span className="font-mono text-[11px] px-3 py-1.5 border border-[rgba(255,75,43,0.4)] text-[#FF4B2B] bg-[rgba(255,75,43,0.06)] flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF4B2B] animate-pulse" />
          LIVE OPS MODE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left */}
        <div className="flex flex-col gap-6">
          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-[rgba(255,75,43,0.4)] bg-[rgba(255,75,43,0.06)] p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <AlertTriangle size={28} className="text-[#FF4B2B]" />
                <p className="font-mono text-[13px] font-semibold text-white mt-2">
                  Report Emergency Incident
                </p>
                <p className="font-mono text-[11px] text-[rgba(255,255,255,0.6)]">
                  Signal a medical, fire, or safety event to all relevant authorities.
                </p>
              </div>
              <button
                className="w-full py-3 font-mono text-[12px] tracking-widest uppercase bg-white text-[#FF4B2B] font-bold hover:bg-[rgba(255,255,255,0.9)] transition-colors"
                onClick={() => setIncidentOpen(true)}
              >
                Initialize Incident Response
              </button>
            </div>

            <div className="border-2 border-[rgba(255,176,0,0.3)] bg-[rgba(255,176,0,0.05)] p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Cloud size={28} className="text-[#FFB000]" />
                <p className="font-mono text-[13px] font-semibold text-white mt-2">
                  Weather & Environment
                </p>
                <p className="font-mono text-[11px] text-[rgba(255,255,255,0.6)]">
                  Advisory: Small craft warning active for Northern Abaco.
                </p>
              </div>
              <Button variant="ghost" onClick={() => setWeatherOpen(true)} className="!text-[#FFB000] !border-[rgba(255,176,0,0.3)]">
                View Active Advisories
              </Button>
            </div>
          </div>

          {/* Crew quick-contact */}
          <Card>
            <CardHeader>
              <span className="flex items-center gap-2">
                <Users size={13} />
                COMMAND TEAM QUICK-CONTACT
              </span>
            </CardHeader>
            <CardContent>
              {crew.length === 0 ? (
                <p className="font-mono text-[11px] text-[rgba(51,255,51,0.25)] py-4 tracking-widest">
                  — NO CREW MEMBERS AVAILABLE —
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {crew.slice(0, 6).map((member) => (
                    <div
                      key={member.id}
                      className="border border-[rgba(51,255,51,0.1)] bg-[rgba(51,255,51,0.02)] p-3 flex flex-col gap-2 cursor-pointer hover:border-[rgba(51,255,51,0.25)] transition-colors"
                      onClick={() => setSelectedCrew(member)}
                    >
                      <span className="font-mono text-[12px] text-[rgba(51,255,51,0.8)]">
                        {member.fullName ?? 'Crew Member'}
                      </span>
                      <span className="font-mono text-[10px] text-[rgba(51,255,51,0.4)]">
                        {member.rank ?? 'Position not set'}
                      </span>
                      <button
                        className="flex items-center justify-center gap-2 py-1.5 font-mono text-[10px] tracking-widest border border-[rgba(0,255,255,0.3)] text-[#00FFFF] bg-[rgba(0,255,255,0.04)] hover:bg-[rgba(0,255,255,0.08)] transition-colors mt-1"
                        onClick={(e) => { e.stopPropagation(); setSelectedCrew(member); }}
                      >
                        <Phone size={10} />
                        CALL SECURE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SOPs */}
          <Card>
            <CardHeader>
              <span className="flex items-center gap-2">
                <Shield size={13} />
                STANDARD OPERATING PROCEDURES (SOPs)
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <SopCard title="Medical Procedure" steps={[
                  'Secure the casualty area',
                  'Deploy first responder kit',
                  'Page ship medical officer',
                  'Prep heli-vac pad (Bridge)',
                ]} />
                <SopCard title="Fire Procedure" steps={[
                  'Verify fire zone (Engine Rm)',
                  'Shut fuel intake valves',
                  'Don firefighting gear',
                  'Prep CO2 suppression',
                ]} />
                <SopCard title="MOB Recovery" steps={[
                  'Deploy MOB smoke signal',
                  'Hard turn to starboard',
                  'Mark chart plotter',
                  'Launch rescue tender',
                ]} />
                <SopCard title="Crew Muster Stations" accent="cyan" steps={[
                  'Sound emergency alarm',
                  'All crew to assigned stations',
                  'Section leaders report headcounts',
                  'Cross-check against live roster',
                ]} />
                <SopCard title="STCW Emergency Duties" accent="cyan" steps={[
                  'Access digital muster list',
                  'Verify STCW qualifications for specialized roles',
                  'Assign alternate if primary incapacitated',
                  'Deploy survival crafts',
                ]} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — live feed */}
        <Card className="h-fit">
          <CardHeader>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#FF4B2B] animate-pulse" />
              LIVE INCIDENT FEED
            </span>
          </CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {feed.map((item) => (
              <div key={item.id} className="flex gap-3 px-4 py-3 border-b border-[rgba(51,255,51,0.06)] last:border-b-0">
                <div
                  className="w-[3px] flex-shrink-0 self-stretch"
                  style={{ background: item.type === 'Incident' ? '#FF4B2B' : '#00FFFF' }}
                />
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="font-mono text-[10px] tracking-wider uppercase font-semibold"
                      style={{ color: item.type === 'Incident' ? '#FF4B2B' : '#00FFFF' }}
                    >
                      {item.type}
                    </span>
                    <span className="font-mono text-[10px] text-[rgba(51,255,51,0.3)] tabular-nums">{item.time}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[rgba(51,255,51,0.6)]">{item.message}</span>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="border-t border-[rgba(51,255,51,0.08)] p-3">
            <a href="/audit" className="font-mono text-[10px] text-[rgba(51,255,51,0.4)] hover:text-[#33FF33] tracking-widest w-full block text-center transition-colors">
              VIEW FULL AUDIT LOG
            </a>
          </div>
        </Card>
      </div>

      {/* Incident modal */}
      <TerminalModal
        open={incidentOpen}
        title="EMERGENCY INCIDENT DECLARATION"
        onClose={() => { setIncidentOpen(false); setForm(INITIAL_INCIDENT); setErrors({}); }}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setIncidentOpen(false)} disabled={submitting}>ABORT</Button>
            <Button onClick={handleDeclare} disabled={submitting} className="!text-[#FF4B2B] !border-[rgba(255,75,43,0.4)] hover:!bg-[rgba(255,75,43,0.1)]">
              <AlertTriangle size={11} className="mr-1" />
              {submitting ? 'Declaring...' : 'DECLARE INCIDENT'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <SelectField
            label="Incident Classification"
            required
            error={errors.incidentType}
            value={form.incidentType}
            onChange={(e) => field('incidentType', e.target.value)}
          >
            <option value="" className="bg-[#050505]">Identify the threat…</option>
            <option value="medical" className="bg-[#050505]">Medical — Critical Patient</option>
            <option value="fire" className="bg-[#050505]">Fire / Smoke Detected</option>
            <option value="collision" className="bg-[#050505]">Collision / Structural Failure</option>
            <option value="man_overboard" className="bg-[#050505]">Man Overboard (MOB)</option>
            <option value="mechanical" className="bg-[#050505]">Engine / Steering Failure</option>
            <option value="weather" className="bg-[#050505]">Hazardous Sea State</option>
            <option value="security" className="bg-[#050505]">Security / Breach of Peace</option>
          </SelectField>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Alert Severity"
              required
              error={errors.severity}
              value={form.severity}
              onChange={(e) => field('severity', e.target.value)}
            >
              <option value="" className="bg-[#050505]">Crisis level…</option>
              <option value="critical" className="bg-[#050505]">CRITICAL (Immediate danger)</option>
              <option value="high" className="bg-[#050505]">HIGH (Urgent)</option>
              <option value="medium" className="bg-[#050505]">MEDIUM (Escalating)</option>
            </SelectField>

            <Field
              label="Incident Location"
              required
              error={errors.location}
              placeholder="Zone/Deck..."
              value={form.location}
              onChange={(e) => field('location', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={`font-mono text-[10px] tracking-[0.12em] uppercase ${errors.description ? 'text-[#FF4B2B]' : 'text-[rgba(51,255,51,0.5)]'}`}>
              Situation Briefing *
            </label>
            <textarea
              rows={4}
              className={`${termInputCls} resize-none ${errors.description ? 'border-[rgba(255,75,43,0.5)]' : ''}`}
              placeholder="Provide concise details on current status and immediate needs..."
              value={form.description}
              onChange={(e) => field('description', e.target.value)}
            />
            {errors.description && <span className="font-mono text-[10px] text-[#FF4B2B]">{errors.description}</span>}
          </div>
        </div>
      </TerminalModal>

      {/* Weather modal */}
      <TerminalModal
        open={weatherOpen}
        title="MARITIME WEATHER ADVISORIES"
        onClose={() => setWeatherOpen(false)}
        footer={<Button onClick={() => setWeatherOpen(false)}>Acknowledged</Button>}
      >
        <div className="flex flex-col gap-4">
          <div className="border border-[rgba(255,176,0,0.3)] bg-[rgba(255,176,0,0.04)] px-3 py-3 flex items-start gap-2">
            <Waves size={13} className="text-[#FFB000] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-mono text-[11px] font-semibold text-[#FFB000]">Small Craft Advisory</p>
              <p className="font-mono text-[11px] text-[rgba(255,176,0,0.7)] leading-relaxed">
                Northwest Bahamas: Winds 20–25 kts from NE. Seas 6–9 ft. Small craft should remain in port.
              </p>
            </div>
          </div>
          <div className="border border-[rgba(255,75,43,0.3)] bg-[rgba(255,75,43,0.04)] px-3 py-3 flex items-start gap-2">
            <AlertTriangle size={13} className="text-[#FF4B2B] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-mono text-[11px] font-semibold text-[#FF4B2B]">Gale Watch</p>
              <p className="font-mono text-[11px] text-[rgba(255,75,43,0.7)] leading-relaxed">
                Deep waters east of Abaco: Possible gale force winds later this evening.
              </p>
            </div>
          </div>
          <div className="border-t border-[rgba(51,255,51,0.08)] pt-4 flex flex-col gap-2">
            {[['Local Nassau Tide', 'High 14:32 (0.9m)'], ['Barometric Pressure', '1014mb (Falling)']].map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between">
                <span className="font-mono text-[11px] text-[rgba(51,255,51,0.5)]">{lbl}</span>
                <span className="font-mono text-[11px] text-[rgba(51,255,51,0.8)]">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </TerminalModal>

      {/* Contact modal */}
      {selectedCrew && (
        <TerminalModal
          open={!!selectedCrew}
          title="ESTABLISHING SECURE LINK"
          onClose={() => setSelectedCrew(null)}
          footer={
            <Button onClick={() => setSelectedCrew(null)} className="!text-[#FF4B2B] !border-[rgba(255,75,43,0.4)]">
              <Radio size={11} className="mr-1" />
              END SECURE CALL
            </Button>
          }
        >
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 border-2 border-[rgba(51,255,51,0.3)] flex items-center justify-center">
              <Users size={28} className="text-[rgba(51,255,51,0.5)]" />
            </div>
            <div className="text-center flex flex-col gap-1">
              <p className="font-mono text-[14px] text-[rgba(51,255,51,0.8)]">{selectedCrew.fullName}</p>
              <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">{selectedCrew.rank}</p>
            </div>
            <div className="mt-4 px-6 py-2 border border-[rgba(0,255,255,0.4)] bg-[rgba(0,255,255,0.04)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00FFFF] animate-pulse" />
              <span className="font-mono text-[11px] text-[#00FFFF] tracking-widest">ENCRYPTED VOICE LINK ACTIVE</span>
            </div>
          </div>
        </TerminalModal>
      )}
    </DashboardLayout>
  );
}
