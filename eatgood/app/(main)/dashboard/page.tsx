'use client';

import { useMockData } from '@/context/MockDataContext';
import {
  MessageSquare,
  Zap,
  CheckSquare,
  Flame,
  ChevronRight,
  Pin,
  Bell,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Conversation, Task } from '@/context/MockDataContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

// ─── Stat Card ────────────────────────────────────────────────────────────────
// Rule 06: brand accent used only on the primary metric; all others are neutral.
// Rule 01: no accent classes — icon bg uses semantic muted/secondary tokens.
// Rule 04: value uses type-heading, label uses type-micro.

function StatCard({
  label,
  value,
  icon: Icon,
  isPrimary = false,
  delay,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  isPrimary?: boolean;
  delay: number;
}) {
  return (
    <Card
      className="animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="flex flex-col gap-3 pt-4">
        <div
          className={[
            'w-9 h-9 rounded-lg flex items-center justify-center',
            isPrimary
              ? 'bg-secondary text-primary'
              : 'bg-muted text-muted-foreground',
          ].join(' ')}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <div>
          <p className="type-heading text-foreground leading-none">{value}</p>
          <p className="type-micro text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Conversation Row ─────────────────────────────────────────────────────────
// Rule 01: model provider displayed as neutral badge — no per-provider accent colors.
// Rule 04: title → type-label, preview → type-caption, metadata → type-micro.

function ConversationRow({ conv, delay }: { conv: Conversation; delay: number }) {
  return (
    <button
      className="w-full flex items-start gap-3 py-4 text-left group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center mt-0.5">
        <MessageSquare size={16} strokeWidth={1.75} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="type-label text-foreground truncate">{conv.title}</p>
          {conv.isPinned && (
            <Pin size={11} className="text-primary flex-shrink-0" strokeWidth={2} />
          )}
        </div>
        <p className="type-caption text-muted-foreground truncate">{conv.preview}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="type-micro px-1.5 py-0 h-auto rounded-sm">
            {conv.model}
          </Badge>
          <span className="type-micro text-muted-foreground">{conv.timestamp}</span>
          <span className="type-micro text-muted-foreground">·</span>
          <span className="type-micro text-muted-foreground">{conv.messageCount} msgs</span>
        </div>
      </div>
      <ChevronRight
        size={16}
        className="text-muted-foreground flex-shrink-0 mt-1 group-hover:text-foreground transition-colors"
        strokeWidth={1.75}
      />
    </button>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────
// Rule 06: high priority uses destructive token (red = urgent). medium/low = muted.
// Rule 01: no hardcoded palette colors — only destructive and muted semantic tokens.

const PRIORITY_VARIANT: Record<string, { bg: string; text: string }> = {
  high:   { bg: 'bg-destructive/10', text: 'text-destructive' },
  medium: { bg: 'bg-muted',          text: 'text-muted-foreground' },
  low:    { bg: 'bg-muted',          text: 'text-muted-foreground' },
};

function TaskRow({ task, delay }: { task: Task; delay: number }) {
  const isComplete = task.status === 'completed';
  const priority = PRIORITY_VARIANT[task.priority];

  return (
    <div
      className="flex items-center gap-3 py-3.5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={[
          'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
          isComplete ? 'bg-primary border-primary' : 'border-border bg-transparent',
        ].join(' ')}
      >
        {isComplete && (
          <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={[
            'type-label leading-snug',
            isComplete ? 'text-muted-foreground line-through' : 'text-foreground',
          ].join(' ')}
        >
          {task.title}
        </p>
        <p className="type-micro text-muted-foreground mt-0.5">{task.project}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={[
            'type-micro px-1.5 py-0.5 rounded-sm uppercase',
            priority.bg,
            priority.text,
          ].join(' ')}
        >
          {task.priority}
        </span>
        <span className="type-micro text-muted-foreground">{task.dueDate}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, unreadNotifications } = useMockData();
  const { user, stats, recentConversations, tasks } = data;

  const activeTasks   = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const tokenPct = Math.min((stats.tokensUsed / stats.tokenLimit) * 100, 100);

  // Rule 06: only the primary brand metric (conversations) gets the brand icon accent.
  const STATS = [
    { label: 'Conversations', value: String(stats.totalConversations), icon: MessageSquare, isPrimary: true },
    { label: 'Tokens used',   value: formatTokens(stats.tokensUsed),   icon: Zap },
    { label: 'Tasks done',    value: String(stats.tasksCompleted),      icon: CheckSquare },
    { label: 'Day streak',    value: String(stats.streakDays),          icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-screen pt-14 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="type-micro text-muted-foreground uppercase tracking-wider">{TODAY}</p>
            <h1 className="type-heading text-foreground mt-1">
              {getGreeting()}, {user.name.split(' ')[0]}
            </h1>
          </div>
          {/* rounded-pill — Bell button is an interactive chip-tier element */}
          <button className="relative w-10 h-10 rounded-pill bg-muted flex items-center justify-center active:bg-border transition-colors">
            <Bell size={20} strokeWidth={1.75} className="text-muted-foreground" />
            {unreadNotifications > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
            )}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-list">
          <div className="flex justify-between items-baseline">
            <span className="type-micro text-muted-foreground">Token quota this month</span>
            <span className="type-micro text-foreground font-semibold">
              {formatTokens(stats.tokensUsed)} / {formatTokens(stats.tokenLimit)}
            </span>
          </div>
          <Progress value={tokenPct} className="h-1.5" />
        </div>
      </header>

      {/* ── Content — px-screen for edge breathing room, gap-section between sections ── */}
      <div className="px-screen py-5 flex flex-col gap-section pb-nav">

        {/* Stats — gap-cols for the 2-column horizontal grid */}
        <section>
          <div className="grid grid-cols-2 gap-cols">
            {STATS.map((s, i) => (
              <StatCard key={s.label} {...s} delay={i * 40} />
            ))}
          </div>
        </section>

        {/* Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="type-subheading text-foreground">Tasks</h2>
            <span className="type-micro text-muted-foreground">
              {completedTasks.length}/{tasks.length} complete
            </span>
          </div>
          <Card>
            <CardContent className="px-inner py-0 divide-y divide-border">
              {activeTasks.map((task, i) => (
                <TaskRow key={task.id} task={task} delay={i * 30} />
              ))}
              {completedTasks.slice(0, 2).map((task, i) => (
                <TaskRow key={task.id} task={task} delay={(activeTasks.length + i) * 30} />
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Recent conversations */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="type-subheading text-foreground">Recent</h2>
            <button className="type-caption text-primary font-semibold active:opacity-70">
              See all
            </button>
          </div>
          <Card>
            <CardContent className="px-inner py-0 divide-y divide-border">
              {recentConversations.slice(0, 5).map((conv, i) => (
                <ConversationRow key={conv.id} conv={conv} delay={i * 30} />
              ))}
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
