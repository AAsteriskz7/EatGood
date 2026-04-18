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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  delay,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  delay: number;
}) {
  return (
    <div
      className="bg-surface-elevated rounded-card p-4 shadow-card flex flex-col gap-3 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[22px] font-display font-bold text-content-primary leading-none">
          {value}
        </p>
        <p className="text-[11px] font-body text-content-tertiary mt-1 leading-tight">
          {label}
        </p>
      </div>
    </div>
  );
}

function ModelBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    OpenAI: 'bg-emerald-50 text-emerald-700',
    Anthropic: 'bg-amber-50 text-amber-700',
    Google: 'bg-blue-50 text-blue-700',
  };
  return (
    <span
      className={`text-[9px] font-display font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${colors[provider] ?? 'bg-surface-muted text-content-secondary'}`}
    >
      {provider}
    </span>
  );
}

function ConversationRow({ conv, delay }: { conv: Conversation; delay: number }) {
  return (
    <button
      className="w-full flex items-start gap-3 py-3.5 text-left group animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center mt-0.5">
        <MessageSquare size={16} strokeWidth={1.75} className="text-content-tertiary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-display font-semibold text-content-primary truncate leading-snug">
            {conv.title}
          </p>
          {conv.isPinned && (
            <Pin size={11} className="text-brand flex-shrink-0" strokeWidth={2} />
          )}
        </div>
        <p className="text-[12px] font-body text-content-tertiary truncate leading-snug">
          {conv.preview}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <ModelBadge provider={conv.modelProvider} />
          <span className="text-[10px] text-content-tertiary">{conv.timestamp}</span>
          <span className="text-[10px] text-content-tertiary">·</span>
          <span className="text-[10px] text-content-tertiary">
            {conv.messageCount} msgs
          </span>
        </div>
      </div>
      <ChevronRight
        size={16}
        className="text-content-tertiary flex-shrink-0 mt-1 group-hover:text-content-secondary transition-colors"
        strokeWidth={1.75}
      />
    </button>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-50 text-red-600 border-red-100',
  medium: 'bg-amber-50 text-amber-600 border-amber-100',
  low: 'bg-surface-muted text-content-tertiary border-border',
};

function TaskRow({ task, delay }: { task: Task; delay: number }) {
  const isComplete = task.status === 'completed';
  return (
    <div
      className="flex items-center gap-3 py-3 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={[
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
          isComplete ? 'bg-brand border-brand' : 'border-border-strong bg-transparent',
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
            'text-[13px] font-body font-medium leading-snug',
            isComplete
              ? 'text-content-tertiary line-through'
              : 'text-content-primary',
          ].join(' ')}
        >
          {task.title}
        </p>
        <p className="text-[11px] text-content-tertiary mt-0.5">{task.project}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={[
            'text-[9px] font-display font-semibold px-1.5 py-0.5 rounded-full border uppercase tracking-wider',
            PRIORITY_STYLES[task.priority],
          ].join(' ')}
        >
          {task.priority}
        </span>
        <span className="text-[11px] text-content-tertiary font-body">
          {task.dueDate}
        </span>
      </div>
    </div>
  );
}

// ─── Usage Bar ────────────────────────────────────────────────────────────────

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] font-body text-content-tertiary">
          Token usage this month
        </span>
        <span className="text-[11px] font-display font-semibold text-content-secondary">
          {formatTokens(used)} / {formatTokens(limit)}
        </span>
      </div>
      <div className="h-1.5 bg-surface-strong rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, unreadNotifications } = useMockData();
  const { user, stats, recentConversations, tasks } = data;
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const STATS = [
    {
      label: 'Conversations',
      value: String(stats.totalConversations),
      icon: MessageSquare,
      accent: 'bg-brand-subtle text-brand',
    },
    {
      label: 'Tokens used',
      value: formatTokens(stats.tokensUsed),
      icon: Zap,
      accent: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Tasks done',
      value: String(stats.tasksCompleted),
      icon: CheckSquare,
      accent: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Day streak',
      value: String(stats.streakDays),
      icon: Flame,
      accent: 'bg-orange-50 text-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <header className="bg-surface-elevated px-5 pt-14 pb-5 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12px] font-body text-content-tertiary">{TODAY}</p>
            <h1 className="text-[22px] font-display font-bold text-content-primary mt-0.5 leading-tight">
              {getGreeting()}, {user.name.split(' ')[0]}
            </h1>
          </div>
          <button className="relative w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center active:bg-surface-strong transition-colors">
            <Bell size={20} strokeWidth={1.75} className="text-content-secondary" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full border-2 border-surface-elevated" />
            )}
          </button>
        </div>

        {/* Usage bar */}
        <div className="mt-4">
          <UsageBar used={stats.tokensUsed} limit={stats.tokenLimit} />
        </div>
      </header>

      <div className="px-4 py-5 space-y-6">
        {/* Stats grid */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((s, i) => (
              <StatCard key={s.label} {...s} delay={i * 40} />
            ))}
          </div>
        </section>

        {/* Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-display font-bold text-content-primary">
              Tasks
            </h2>
            <span className="text-[11px] font-body text-content-tertiary">
              {completedTasks.length}/{tasks.length} complete
            </span>
          </div>
          <div className="bg-surface-elevated rounded-card shadow-card px-4 divide-y divide-border">
            {activeTasks.map((task, i) => (
              <TaskRow key={task.id} task={task} delay={i * 30} />
            ))}
            {completedTasks.slice(0, 2).map((task, i) => (
              <TaskRow key={task.id} task={task} delay={(activeTasks.length + i) * 30} />
            ))}
          </div>
        </section>

        {/* Recent conversations */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-display font-bold text-content-primary">
              Recent
            </h2>
            <button className="text-[12px] font-display font-semibold text-brand active:opacity-70">
              See all
            </button>
          </div>
          <div className="bg-surface-elevated rounded-card shadow-card px-4 divide-y divide-border">
            {recentConversations.slice(0, 5).map((conv, i) => (
              <ConversationRow key={conv.id} conv={conv} delay={i * 30} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
