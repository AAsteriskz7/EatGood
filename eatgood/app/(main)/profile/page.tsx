'use client';

import { useMockData } from '@/context/MockDataContext';
import {
  MessageSquare,
  Zap,
  Flame,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  CreditCard,
  Users,
  BarChart2,
  BookOpen,
  KeyRound,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

const PLAN_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Free: {
    bg: 'bg-surface-muted',
    text: 'text-content-secondary',
    border: 'border-border',
  },
  Pro: {
    bg: 'bg-brand-subtle',
    text: 'text-brand',
    border: 'border-brand-muted',
  },
  Team: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1.5 py-4">
      <div className="w-8 h-8 rounded-full bg-brand-subtle flex items-center justify-center text-brand">
        <Icon size={16} strokeWidth={2} />
      </div>
      <p className="text-[18px] font-display font-bold text-content-primary leading-none">
        {value}
      </p>
      <p className="text-[10px] font-body text-content-tertiary text-center leading-tight">
        {label}
      </p>
    </div>
  );
}

interface MenuRowProps {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  danger?: boolean;
  badge?: string;
  delay?: number;
}

function MenuRow({ icon: Icon, label, sublabel, danger, badge, delay = 0 }: MenuRowProps) {
  return (
    <button
      className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:bg-surface-muted transition-colors animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={[
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
          danger ? 'bg-red-50' : 'bg-surface-muted',
        ].join(' ')}
      >
        <Icon
          size={18}
          strokeWidth={1.75}
          className={danger ? 'text-red-500' : 'text-content-secondary'}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={[
            'text-[14px] font-body font-medium leading-snug',
            danger ? 'text-red-500' : 'text-content-primary',
          ].join(' ')}
        >
          {label}
        </p>
        {sublabel && (
          <p className="text-[11px] font-body text-content-tertiary mt-0.5">
            {sublabel}
          </p>
        )}
      </div>
      {badge && (
        <span className="text-[9px] font-display font-bold px-2 py-0.5 rounded-full bg-brand-subtle text-brand border border-brand-muted uppercase tracking-wider">
          {badge}
        </span>
      )}
      {!danger && (
        <ChevronRight
          size={16}
          strokeWidth={1.75}
          className="text-content-tertiary flex-shrink-0"
        />
      )}
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="px-4 pt-5 pb-2 text-[11px] font-display font-semibold text-content-tertiary uppercase tracking-widest">
      {title}
    </p>
  );
}

// ─── Usage Mini-Chart ─────────────────────────────────────────────────────────

function UsageBars({ history }: { history: { date: string; tokens: number }[] }) {
  const max = Math.max(...history.map((h) => h.tokens));
  return (
    <div className="flex items-end gap-1.5 h-12">
      {history.map((h, i) => {
        const pct = (h.tokens / max) * 100;
        return (
          <div key={h.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-sm bg-surface-strong overflow-hidden" style={{ height: '36px' }}>
              <div
                className="w-full bg-brand rounded-t-sm transition-all duration-500"
                style={{
                  height: `${pct}%`,
                  marginTop: `${100 - pct}%`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            </div>
            <span className="text-[9px] text-content-tertiary font-body">{h.date}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data } = useMockData();
  const { user, stats, usageHistory } = data;

  const plan = PLAN_STYLES[user.plan] ?? PLAN_STYLES['Free'];
  const tokenPct = Math.round((stats.tokensUsed / stats.tokenLimit) * 100);

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Hero section */}
      <div className="bg-surface-elevated px-5 pt-14 pb-6 shadow-card">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center flex-shrink-0 shadow-action">
            <span className="text-[22px] font-display font-bold text-white">
              {user.initials}
            </span>
          </div>

          {/* Name & plan */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-display font-bold text-content-primary leading-tight">
              {user.name}
            </h1>
            <p className="text-[12px] font-body text-content-tertiary mt-0.5 truncate">
              {user.email}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={[
                  'text-[10px] font-display font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider',
                  plan.bg,
                  plan.text,
                  plan.border,
                ].join(' ')}
              >
                {user.plan} Plan
              </span>
              <span className="text-[11px] font-body text-content-tertiary">
                Since {user.joinedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Stat pills */}
        <div className="mt-5 flex divide-x divide-border bg-surface-muted rounded-card overflow-hidden">
          <StatPill
            label="Conversations"
            value={String(stats.totalConversations)}
            icon={MessageSquare}
          />
          <StatPill
            label="Tokens used"
            value={formatTokens(stats.tokensUsed)}
            icon={Zap}
          />
          <StatPill
            label="Day streak"
            value={`${stats.streakDays}d`}
            icon={Flame}
          />
        </div>
      </div>

      {/* Usage chart section */}
      <div className="px-4 pt-5">
        <div className="bg-surface-elevated rounded-card shadow-card px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-display font-semibold text-content-primary">
              Weekly token usage
            </p>
            <p className="text-[12px] font-body text-content-tertiary">
              {tokenPct}% of monthly quota
            </p>
          </div>
          <UsageBars history={usageHistory} />
          {/* Quota bar */}
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 bg-surface-strong rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full"
                style={{ width: `${tokenPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-body text-content-tertiary">
              <span>{formatTokens(stats.tokensUsed)} used</span>
              <span>{formatTokens(stats.tokenLimit)} limit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu sections */}
      <div className="pb-4">
        <SectionHeader title="Account" />
        <div className="bg-surface-elevated rounded-card shadow-card overflow-hidden divide-y divide-border mx-4">
          <MenuRow icon={CreditCard} label="Billing & Plan" sublabel="Pro — renews Dec 1" delay={0} />
          <MenuRow icon={KeyRound} label="API Keys" sublabel="3 active keys" delay={30} />
          <MenuRow icon={Users} label="Team members" sublabel="2 of 5 seats used" delay={60} />
        </div>

        <SectionHeader title="Workspace" />
        <div className="bg-surface-elevated rounded-card shadow-card overflow-hidden divide-y divide-border mx-4">
          <MenuRow icon={BookOpen} label="Prompt Library" sublabel="12 saved prompts" badge="New" delay={0} />
          <MenuRow icon={BarChart2} label="Usage Analytics" sublabel="Full breakdown" delay={30} />
        </div>

        <SectionHeader title="Preferences" />
        <div className="bg-surface-elevated rounded-card shadow-card overflow-hidden divide-y divide-border mx-4">
          <MenuRow icon={Bell} label="Notifications" delay={0} />
          <MenuRow icon={Shield} label="Privacy & Security" delay={30} />
          <MenuRow icon={HelpCircle} label="Help & Support" delay={60} />
        </div>

        <div className="mt-3 mx-4 bg-surface-elevated rounded-card shadow-card overflow-hidden">
          <MenuRow icon={LogOut} label="Sign out" danger delay={0} />
        </div>

        <p className="text-center text-[10px] font-body text-content-tertiary mt-5 mb-2">
          Synthex v1.0.0 · {user.timezone}
        </p>
      </div>
    </div>
  );
}
