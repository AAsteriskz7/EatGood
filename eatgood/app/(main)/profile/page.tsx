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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
// Rule 06: all three stats use the same icon treatment — no competing accents.
// Rule 04: value → type-heading, label → type-micro.

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
    <div className="flex-1 flex flex-col items-center gap-2 py-4">
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary">
        <Icon size={16} strokeWidth={2} />
      </div>
      <p className="type-heading text-foreground leading-none">{value}</p>
      <p className="type-micro text-muted-foreground text-center">{label}</p>
    </div>
  );
}

// ─── Menu Row ─────────────────────────────────────────────────────────────────
// Rule 06: destructive action uses destructive token (red = irreversible action).
// Rule 01: icon bg for danger uses destructive/10 — no hardcoded red-50.
// Rule 04: label → type-body, sublabel → type-micro.

interface MenuRowProps {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  danger?: boolean;
  badge?: string;
}

function MenuRow({ icon: Icon, label, sublabel, danger, badge }: MenuRowProps) {
  return (
    <button className="w-full flex items-center gap-4 px-4 py-4 text-left active:bg-muted transition-colors">
      <div
        className={[
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
          danger ? 'bg-destructive/10' : 'bg-muted',
        ].join(' ')}
      >
        <Icon
          size={18}
          strokeWidth={1.75}
          className={danger ? 'text-destructive' : 'text-muted-foreground'}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={[
            'type-body leading-snug',
            danger ? 'text-destructive' : 'text-foreground',
          ].join(' ')}
        >
          {label}
        </p>
        {sublabel && (
          <p className="type-micro text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>
      {badge && (
        <Badge variant="secondary" className="type-micro shrink-0">
          {badge}
        </Badge>
      )}
      {!danger && (
        <ChevronRight size={16} strokeWidth={1.75} className="text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <p className="type-micro text-muted-foreground uppercase tracking-widest px-4 pt-5 pb-2">
      {title}
    </p>
  );
}

// ─── Usage Bar Chart ──────────────────────────────────────────────────────────
// Rule 06: single color (primary) for all bars — consistent, no rainbow.
// Rule 01: uses bg-primary and bg-muted semantic tokens.

function UsageBars({ history }: { history: { date: string; tokens: number }[] }) {
  const max = Math.max(...history.map((h) => h.tokens));
  return (
    <div className="flex items-end gap-1.5 h-14">
      {history.map((h) => {
        const pct = (h.tokens / max) * 100;
        return (
          <div key={h.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-muted rounded-t-sm overflow-hidden" style={{ height: '42px' }}>
              <div
                className="w-full bg-primary rounded-t-sm transition-all duration-500"
                style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
              />
            </div>
            <span className="type-micro text-muted-foreground">{h.date}</span>
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

  const tokenPct = Math.round((stats.tokensUsed / stats.tokenLimit) * 100);

  // Rule 06: plan badge uses secondary (brand-tinted) for Pro; muted for others.
  // No blue-50 or custom palette — only the token system.
  const planVariant = user.plan === 'Pro' ? 'secondary' : 'outline';

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <div className="bg-card border-b border-border px-screen pt-14 pb-6">
        <div className="flex items-center gap-4">
          {/* Rule 03: Avatar is the brand surface — bg-primary, text-primary-foreground */}
          <Avatar className="w-16 h-16 rounded-2xl">
            <AvatarFallback className="rounded-2xl bg-primary text-primary-foreground type-heading">
              {user.initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="type-heading text-foreground leading-tight">{user.name}</h1>
            <p className="type-caption text-muted-foreground mt-0.5 truncate">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={planVariant} className="type-micro uppercase tracking-wider">
                {user.plan} Plan
              </Badge>
              <span className="type-micro text-muted-foreground">Since {user.joinedDate}</span>
            </div>
          </div>
        </div>

        {/* Stat pills — all use the same secondary/primary treatment */}
        <div className="mt-5 flex divide-x divide-border bg-muted rounded-xl overflow-hidden">
          <StatPill label="Conversations" value={String(stats.totalConversations)} icon={MessageSquare} />
          <StatPill label="Tokens used"   value={formatTokens(stats.tokensUsed)}   icon={Zap} />
          <StatPill label="Day streak"    value={`${stats.streakDays}d`}            icon={Flame} />
        </div>
      </div>

      {/* ── Usage chart ── */}
      <div className="px-screen pt-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="type-label text-foreground font-semibold">Weekly token usage</p>
              <p className="type-micro text-muted-foreground">{tokenPct}% of quota</p>
            </div>
            <UsageBars history={usageHistory} />
            <div className="mt-4 flex flex-col gap-list">
              <Progress value={tokenPct} className="h-1.5" />
              <div className="flex justify-between">
                <span className="type-micro text-muted-foreground">{formatTokens(stats.tokensUsed)} used</span>
                <span className="type-micro text-muted-foreground">{formatTokens(stats.tokenLimit)} limit</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Settings menu ── */}
      <div className="pb-nav flex flex-col gap-list">
        <SectionLabel title="Account" />
        <Card className="mx-screen p-0 overflow-hidden">
          <CardContent className="p-0 divide-y divide-border">
            <MenuRow icon={CreditCard} label="Billing & Plan"  sublabel="Pro — renews Dec 1" />
            <MenuRow icon={KeyRound}   label="API Keys"        sublabel="3 active keys" />
            <MenuRow icon={Users}      label="Team members"    sublabel="2 of 5 seats used" />
          </CardContent>
        </Card>

        <SectionLabel title="Workspace" />
        <Card className="mx-screen p-0 overflow-hidden">
          <CardContent className="p-0 divide-y divide-border">
            <MenuRow icon={BookOpen}  label="Prompt Library"    sublabel="12 saved prompts" badge="New" />
            <MenuRow icon={BarChart2} label="Usage Analytics"   sublabel="Full breakdown" />
          </CardContent>
        </Card>

        <SectionLabel title="Preferences" />
        <Card className="mx-screen p-0 overflow-hidden">
          <CardContent className="p-0 divide-y divide-border">
            <MenuRow icon={Bell}        label="Notifications" />
            <MenuRow icon={Shield}      label="Privacy & Security" />
            <MenuRow icon={HelpCircle}  label="Help & Support" />
          </CardContent>
        </Card>

        <div className="mx-screen">
          <Card className="p-0 overflow-hidden">
            <CardContent className="p-0">
              <MenuRow icon={LogOut} label="Sign out" danger />
            </CardContent>
          </Card>
        </div>

        <p className="type-micro text-muted-foreground text-center mt-5 mb-2">
          Synthex v1.0.0 · {user.timezone}
        </p>
      </div>

    </div>
  );
}
