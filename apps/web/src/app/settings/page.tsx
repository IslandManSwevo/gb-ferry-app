'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TerminalModal, Field, SelectField, termInputCls, termLabelCls } from '@/components/ui/TerminalModal';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { api } from '@/lib/api';
import { canAccess, ROLES } from '@/lib/auth/access';
import { useUserRoles } from '@/lib/auth/roles';
import { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangle,
  Bell,
  Globe,
  History,
  Key,
  Lock,
  Settings,
  Shield,
  ShieldCheck,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fetchSettingsOptions, SettingsOptions } from './options';

/* ── Nav defs ─────────────────────────────────────────────── */
const NAV_ITEMS = [
  { key: 'profile', icon: User, label: 'My Profile', feature: 'settings.profile' },
  { key: 'org', icon: Globe, label: 'Organization', feature: 'settings.org' },
  { key: 'users', icon: Users, label: 'Users & Roster', feature: 'settings.users' },
  { key: 'roles', icon: Key, label: 'Roles & Permissions', feature: 'settings.roles' },
  { key: 'ops-security', icon: Shield, label: 'Operational Security', feature: 'settings.ops-security' },
  { key: 'notifications', icon: Bell, label: 'Notifications', feature: 'settings.notifications' },
  { key: 'compliance', icon: ShieldCheck, label: 'Compliance Policy', feature: 'settings.compliance' },
  { key: 'integrations', icon: Zap, label: 'Integrations & API', feature: 'settings.integrations' },
  { key: 'system-log', icon: History, label: 'System Audit', feature: 'settings.audit' },
];

/* ── Role permissions table ──────────────────────────────── */
const rolePermissions = [
  { feature: 'CBP Submission', admin: true, operations: false, captain: false, compliance: true },
  { feature: 'Crew Roster Mgmt', admin: true, operations: false, captain: true, compliance: false },
  { feature: 'Emergency Operations', admin: true, operations: true, captain: true, compliance: false },
  { feature: 'Vessel Management', admin: true, operations: false, captain: false, compliance: false },
  { feature: 'Certification Verify', admin: true, operations: false, captain: false, compliance: true },
  { feature: 'Compliance Export', admin: true, operations: false, captain: false, compliance: true },
  { feature: 'System Settings', admin: true, operations: false, captain: false, compliance: false },
];

const roleColumns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'feature',
    header: 'Feature / Module',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] text-[rgba(0,242,254,0.8)]">{getValue<string>()}</span>
    ),
  },
  ...['admin', 'operations', 'captain', 'compliance'].map((role) => ({
    accessorKey: role,
    header: role.charAt(0).toUpperCase() + role.slice(1),
    cell: ({ getValue }: any) => {
      const v = getValue() as boolean;
      return (
        <input
          type="checkbox"
          checked={v}
          readOnly={role === 'admin'}
          onChange={() => {}}
          className="w-4 h-4 accent-[#00F2FE] cursor-pointer"
        />
      );
    },
  })),
];

const userColumns: ColumnDef<any, any>[] = [
  {
    id: 'identity',
    header: 'User Identity',
    cell: ({ row }) => {
      const r = row.original;
      const name = r.firstName ? `${r.firstName} ${r.lastName}` : r.email?.split('@')[0];
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[rgba(0,242,254,0.1)] border border-[rgba(0,242,254,0.2)] flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-[10px] text-[#00F2FE]">{name?.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[12px] text-[rgba(0,242,254,0.8)]">{name}</span>
            <span className="font-mono text-[10px] text-[rgba(0,242,254,0.4)]">{r.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => (
      <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)] tracking-widest">
        {String(getValue<string>()).toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: 'lastLoginAt',
    header: 'Last Activity',
    cell: ({ getValue }) => {
      const t = getValue<string>();
      return (
        <span className="font-mono text-[11px] text-[rgba(0,242,254,0.5)]">
          {t ? new Date(t).toLocaleDateString() : 'Never'}
        </span>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const active = row.original.isActive;
      return (
        <span
          className="font-mono text-[10px] px-2 py-0.5 border tracking-widest"
          style={active
            ? { color: '#00F2FE', borderColor: 'rgba(0,242,254,0.4)', background: 'rgba(0,242,254,0.06)' }
            : { color: '#FFB000', borderColor: 'rgba(255,176,0,0.4)', background: 'rgba(255,176,0,0.06)' }}
        >
          {active ? 'ACTIVE' : 'INACTIVE'}
        </span>
      );
    },
  },
];

/* ── Toggle switch ───────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-10 h-5 relative flex-shrink-0 transition-colors border"
      style={{
        background: checked ? 'rgba(0,242,254,0.15)' : 'rgba(0,242,254,0.04)',
        borderColor: checked ? 'rgba(0,242,254,0.5)' : 'rgba(0,242,254,0.2)',
      }}
      aria-pressed={checked}
    >
      <span
        className="absolute top-0.5 w-4 h-4 transition-transform"
        style={{
          background: checked ? '#00F2FE' : 'rgba(0,242,254,0.3)',
          transform: checked ? 'translateX(20px)' : 'translateX(1px)',
        }}
      />
    </button>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function SettingsPage() {
  const roles = useUserRoles();
  const [activeSection, setActiveSection] = useState('profile');
  const [options, setOptions] = useState<SettingsOptions | null>(null);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: '' });
  const [opsSettings, setOpsSettings] = useState({ autoCbpSubmission: true, remoteOverride: false });
  const [orgForm, setOrgForm] = useState({
    orgName: 'Grand Bahama Ferry Ltd.',
    hq: 'Nassau, Bahamas',
    tz: 'America/Nassau',
    currency: 'BSD',
  });

  useEffect(() => {
    fetchSettingsOptions().then(setOptions);
    setLoadingUsers(true);
    api.users.list().then((res) => {
      if (res.data) setUsers(res.data);
      setLoadingUsers(false);
    });
  }, []);

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => canAccess(roles, item.feature)),
    [roles]
  );

  useEffect(() => {
    if (visibleItems.length > 0 && !visibleItems.some((m) => m.key === activeSection)) {
      setActiveSection(visibleItems[0].key);
    }
  }, [visibleItems, activeSection]);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  }

  function dispatchInvite() {
    setInviteOpen(false);
    setInviteForm({ name: '', email: '', role: '' });
  }

  const activeDef = NAV_ITEMS.find((m) => m.key === activeSection);
  const hasAccess = activeDef ? canAccess(roles, activeDef.feature) : false;

  function renderSection() {
    if (!hasAccess) {
      return (
        <div className="border border-[rgba(255,75,43,0.2)] bg-[rgba(255,75,43,0.03)] px-4 py-4 flex items-start gap-2">
          <Lock size={13} className="text-[#FF4B2B] mt-0.5" />
          <div>
            <p className="font-mono text-[11px] text-[#FF4B2B]">Access Restricted</p>
            <p className="font-mono text-[11px] text-[rgba(0,242,254,0.45)]">
              You do not have the required clearance to view this management module.
            </p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'profile':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 border-2 border-[rgba(0,242,254,0.2)] bg-[rgba(0,242,254,0.04)] flex items-center justify-center flex-shrink-0">
                <User size={32} className="text-[rgba(0,242,254,0.4)]" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-mono text-[14px] text-[rgba(0,242,254,0.8)]">System Staff</p>
                <p className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">staff@gbferry.com</p>
                <p className="font-mono text-[10px] text-[rgba(0,242,254,0.3)] tracking-widest uppercase">
                  {roles.join(' · ').toUpperCase()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={termLabelCls}>Full Display Name</label>
                <input type="text" className={`${termInputCls} opacity-50 cursor-not-allowed`} value="System Staff" readOnly />
              </div>
              <div className="flex flex-col gap-1">
                <label className={termLabelCls}>Email Address</label>
                <input type="email" className={`${termInputCls} opacity-50 cursor-not-allowed`} value="staff@gbferry.com" readOnly />
              </div>
            </div>
            <div className="border-t border-[rgba(0,242,254,0.06)] pt-4">
              <a href="/audit" className="font-mono text-[11px] text-[#00F2FE] hover:text-[rgba(0,242,254,0.7)] transition-colors flex items-center gap-2">
                <History size={12} />
                View My Activity Log
              </a>
            </div>
          </div>
        );

      case 'org':
        return (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Maritime Authority Name"
                value={orgForm.orgName}
                onChange={(e) => setOrgForm((f) => ({ ...f, orgName: e.target.value }))}
              />
              <Field
                label="Regional Headquarters"
                value={orgForm.hq}
                onChange={(e) => setOrgForm((f) => ({ ...f, hq: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={termLabelCls}>Primary Timezone</label>
                <select
                  className={termInputCls}
                  value={orgForm.tz}
                  onChange={(e) => setOrgForm((f) => ({ ...f, tz: e.target.value }))}
                >
                  {(options?.timezones ?? ['America/Nassau', 'America/New_York', 'UTC']).map((t) => (
                    <option key={t} value={t} className="bg-[#0B132B]">{t}</option>
                  ))}
                </select>
              </div>
              <SelectField
                label="Operational Currency"
                value={orgForm.currency}
                onChange={(e) => setOrgForm((f) => ({ ...f, currency: e.target.value }))}
              >
                <option value="BSD" className="bg-[#0B132B]">BSD</option>
                <option value="USD" className="bg-[#0B132B]">USD</option>
              </SelectField>
            </div>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        );

      case 'users':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="font-mono text-[13px] tracking-[0.08em] uppercase text-[rgba(0,242,254,0.8)]">
                  Identity & Access Management
                </p>
                <p className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">
                  Managing access for {users.length} staff members
                </p>
              </div>
              <Button icon={<Users size={11} />} onClick={() => setInviteOpen(true)}>
                Onboard Staff
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '2FA ENROLLMENT', value: '100%', status: 'ok' },
                { label: 'ACTIVE LICENSES', value: '4', status: 'info' },
                { label: 'PENDING APPROVALS', value: '2', status: 'warning' },
              ].map(({ label, value, status }) => (
                <div key={label} className="border border-[rgba(0,242,254,0.15)] bg-[#0B132B] p-4 flex flex-col gap-1">
                  <span className="font-mono text-[10px] tracking-[0.12em] text-[rgba(0,242,254,0.4)]">{label}</span>
                  <span className={`font-mono text-2xl font-bold tabular-nums ${
                    status === 'ok' ? 'text-[#00F2FE]'
                    : status === 'warning' ? 'text-[#FFB000]'
                    : 'text-[#00F2FE]'
                  }`}>{value}</span>
                </div>
              ))}
            </div>

            <TerminalTable
              data={users}
              columns={userColumns}
              loading={loadingUsers}
              rowKey={(r) => r.id}
              emptyMessage="NO STAFF FOUND"
            />
          </div>
        );

      case 'roles':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[13px] tracking-[0.08em] uppercase text-[rgba(0,242,254,0.8)]">
                RBAC Configuration
              </p>
              <p className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">
                Define feature-level access for platform roles
              </p>
            </div>

            <TerminalTable
              data={rolePermissions}
              columns={roleColumns}
              rowKey={(r) => r.feature}
              emptyMessage="NO PERMISSIONS"
            />

            <div className="border border-[rgba(0,242,254,0.2)] bg-[rgba(0,242,254,0.03)] px-4 py-3 flex items-start gap-2">
              <ShieldCheck size={12} className="text-[#00F2FE] mt-0.5 flex-shrink-0" />
              <p className="font-mono text-[11px] text-[rgba(0,242,254,0.6)] leading-relaxed">
                SuperAdmin Override Active — changes take effect across all logged-in sessions immediately.
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving}>{saving ? 'Committing...' : 'Commit Changes'}</Button>
          </div>
        );

      case 'ops-security':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[13px] tracking-[0.08em] uppercase text-[rgba(0,242,254,0.8)]">
                Operational Guardrails
              </p>
              <p className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">
                Preventive measures for fleet safety and manual overrides
              </p>
            </div>

            <Card>
              <CardContent className="flex flex-col gap-6 pt-4">
                {[
                  {
                    key: 'autoCbpSubmission' as const,
                    label: 'Automated CBP eNOAD Submission',
                    desc: 'Automatically submit ACE eNOAD 96 hours before scheduled departure',
                  },
                  {
                    key: 'remoteOverride' as const,
                    label: 'Remote Shore-Side Override',
                    desc: 'Allow shore-side compliance officers to override bridge-sync blocks',
                  },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[12px] text-[rgba(0,242,254,0.8)]">{label}</span>
                      <span className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">{desc}</span>
                    </div>
                    <Toggle
                      checked={opsSettings[key]}
                      onChange={(v) => setOpsSettings((s) => ({ ...s, [key]: v }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div>
              <p className="font-mono text-[11px] tracking-widest uppercase text-[#FF4B2B] mb-3">
                EMERGENCY FLEET SUSPENSION
              </p>
              <div className="border border-[rgba(255,75,43,0.3)] bg-[rgba(255,75,43,0.04)] px-4 py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[12px] text-[rgba(0,242,254,0.8)]">Enable Global Lockout</span>
                  <span className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">
                    Terminates all user sessions and disables check-in systems.
                  </span>
                </div>
                <Button
                  className="!text-[#FF4B2B] !border-[rgba(255,75,43,0.4)] hover:!bg-[rgba(255,75,43,0.1)]"
                  variant="ghost"
                  icon={<AlertTriangle size={11} />}
                >
                  INITIATE LOCKDOWN
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="border border-[rgba(0,242,254,0.15)] bg-[rgba(0,242,254,0.03)] px-4 py-4 flex items-start gap-2">
            <Settings size={13} className="text-[#00F2FE] mt-0.5" />
            <p className="font-mono text-[11px] text-[rgba(0,242,254,0.6)] leading-relaxed">
              This configuration panel is currently being localized for the Bahamian regulatory region.
            </p>
          </div>
        );
    }
  }

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#00F2FE] font-semibold flex items-center gap-2">
            <Settings size={16} />
            System Management Hub
          </h1>
          <div className="flex items-center gap-3">
            {roles.includes(ROLES.SUPERADMIN) && (
              <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(255,176,0,0.4)] text-[#FFB000] bg-[rgba(255,176,0,0.04)] tracking-widest">
                SUPERADMIN ACCESS
              </span>
            )}
            {roles.includes(ROLES.ADMIN) && !roles.includes(ROLES.SUPERADMIN) && (
              <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)] tracking-widest">
                ADMIN PRIVILEGES
              </span>
            )}
            <span className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">
              Roles: {roles.join(', ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        {/* Nav sidebar */}
        <Card className="h-fit">
          <CardContent className="p-1">
            <ul>
              {visibleItems.map(({ key, icon: Icon, label }) => (
                <li key={key}>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 font-mono text-[11px] transition-colors text-left ${
                      activeSection === key
                        ? 'bg-[rgba(0,242,254,0.08)] text-[#00F2FE] border-l-2 border-[#00F2FE]'
                        : 'text-[rgba(0,242,254,0.45)] hover:text-[rgba(0,242,254,0.7)] border-l-2 border-transparent'
                    }`}
                    onClick={() => setActiveSection(key)}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Content panel */}
        <Card>
          <CardContent className="pt-4">
            {renderSection()}
          </CardContent>
        </Card>
      </div>

      {/* Invite modal */}
      <TerminalModal
        open={inviteOpen}
        title="ONBOARD NEW STAFF MEMBER"
        onClose={() => setInviteOpen(false)}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={dispatchInvite}>Dispatch Invite</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Staff Member Name"
            required
            placeholder="Capt. Jane Doe"
            value={inviteForm.name}
            onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Field
            label="Platform Email"
            type="email"
            required
            placeholder="jane.doe@gbferry.com"
            value={inviteForm.email}
            onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
          />
          <SelectField
            label="Initial Role Delegation"
            required
            value={inviteForm.role}
            onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="" className="bg-[#0B132B]">Assign role…</option>
            <option value="captain" className="bg-[#0B132B]">Vessel Master</option>
            <option value="operations" className="bg-[#0B132B]">Ops Staff</option>
            <option value="compliance" className="bg-[#0B132B]">Compliance Officer</option>
          </SelectField>
        </div>
      </TerminalModal>
    </DashboardLayout>
  );
}
