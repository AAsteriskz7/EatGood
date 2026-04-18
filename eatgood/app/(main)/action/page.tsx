'use client';

import { useState } from 'react';
import { useMockData } from '@/context/MockDataContext';
import {
  ArrowUp,
  ChevronDown,
  FileText,
  BarChart2,
  Code2,
  Mail,
  Lightbulb,
  Globe,
  CheckCheck,
  Paperclip,
} from 'lucide-react';
import type { AIModel } from '@/context/MockDataContext';

// ─── Icon map for prompt categories ──────────────────────────────────────────

const PROMPT_ICONS: Record<string, React.ElementType> = {
  Productivity: CheckCheck,
  Writing: FileText,
  Analysis: BarChart2,
  Engineering: Code2,
  Strategy: Globe,
};

function PromptIcon({ category }: { category: string }) {
  const Icon = PROMPT_ICONS[category] ?? Lightbulb;
  return <Icon size={16} strokeWidth={1.75} />;
}

// ─── Model Selector ───────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: 'text-emerald-600',
  Anthropic: 'text-amber-600',
  Google: 'text-blue-600',
};

const BADGE_COLORS: Record<string, string> = {
  Fast: 'bg-emerald-50 text-emerald-700',
  Smart: 'bg-amber-50 text-amber-700',
  New: 'bg-blue-50 text-blue-700',
};

function ModelSelector({
  models,
  activeId,
  onSelect,
}: {
  models: AIModel[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = models.find((m) => m.id === activeId) ?? models[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-muted active:bg-surface-strong transition-colors"
      >
        <span className={`text-[12px] font-display font-semibold ${PROVIDER_COLORS[current.provider] ?? 'text-content-secondary'}`}>
          {current.name}
        </span>
        <span className={`text-[9px] font-display font-semibold px-1.5 py-0.5 rounded-full ${BADGE_COLORS[current.badge] ?? 'bg-surface-strong text-content-tertiary'}`}>
          {current.badge}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`text-content-tertiary transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-surface-elevated rounded-card shadow-card-hover border border-border z-20 overflow-hidden animate-scale-in">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setOpen(false);
                }}
                className={[
                  'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors',
                  model.id === activeId
                    ? 'bg-brand-subtle'
                    : 'hover:bg-surface-muted active:bg-surface-strong',
                ].join(' ')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-display font-semibold ${PROVIDER_COLORS[model.provider] ?? 'text-content-primary'}`}>
                      {model.name}
                    </span>
                    <span className={`text-[9px] font-display font-semibold px-1.5 py-0.5 rounded-full ${BADGE_COLORS[model.badge] ?? ''}`}>
                      {model.badge}
                    </span>
                    {model.id === activeId && (
                      <CheckCheck size={13} strokeWidth={2} className="text-brand ml-auto flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] font-body text-content-tertiary mt-0.5 leading-snug">
                    {model.description}
                  </p>
                  <p className="text-[10px] font-body text-content-tertiary mt-1">
                    Context: {model.contextWindow} tokens
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActionPage() {
  const { data, activeModel, setActiveModel } = useMockData();
  const { models, suggestedPrompts, recentConversations } = data;

  const [prompt, setPrompt] = useState('');
  const hasInput = prompt.trim().length > 0;

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      {/* Header */}
      <header className="bg-surface-elevated px-5 pt-14 pb-4 shadow-card">
        <h1 className="text-[22px] font-display font-bold text-content-primary">
          Compose
        </h1>
        <p className="text-[13px] font-body text-content-tertiary mt-0.5">
          Start a new AI conversation
        </p>
      </header>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Compose card */}
        <section className="bg-surface-elevated rounded-card shadow-card overflow-hidden">
          {/* Model selector row */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
            <span className="text-[11px] font-body text-content-tertiary uppercase tracking-wider">
              Model
            </span>
            <ModelSelector
              models={models}
              activeId={activeModel}
              onSelect={setActiveModel}
            />
          </div>

          {/* Textarea */}
          <div className="px-4 pt-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What do you want to work on today?"
              rows={5}
              className={[
                'w-full resize-none bg-transparent',
                'text-[15px] font-body text-content-primary',
                'placeholder:text-content-tertiary',
                'focus:outline-none leading-relaxed',
              ].join(' ')}
            />
          </div>

          {/* Toolbar row */}
          <div className="flex items-center justify-between px-4 pb-4 pt-2">
            <button className="flex items-center gap-1.5 text-content-tertiary active:text-content-secondary transition-colors">
              <Paperclip size={18} strokeWidth={1.75} />
              <span className="text-[12px] font-body">Attach</span>
            </button>

            <button
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center',
                'transition-all duration-150',
                hasInput
                  ? 'bg-brand shadow-action active:scale-95'
                  : 'bg-surface-strong cursor-not-allowed',
              ].join(' ')}
              disabled={!hasInput}
            >
              <ArrowUp
                size={20}
                strokeWidth={2.25}
                className={hasInput ? 'text-white' : 'text-content-tertiary'}
              />
            </button>
          </div>
        </section>

        {/* Suggested prompts */}
        <section>
          <h2 className="text-[13px] font-display font-semibold text-content-tertiary uppercase tracking-wider mb-3 px-1">
            Suggestions
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {suggestedPrompts.map((sp, i) => (
              <button
                key={sp.id}
                onClick={() => setPrompt(sp.text)}
                className="animate-fade-up bg-surface-elevated rounded-card shadow-card px-4 py-3.5 text-left flex items-start gap-3 active:bg-surface-muted transition-colors"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="w-7 h-7 rounded-lg bg-brand-subtle flex items-center justify-center flex-shrink-0 mt-0.5 text-brand">
                  <PromptIcon category={sp.category} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-body font-medium text-content-primary leading-snug">
                    {sp.text}
                  </p>
                  <p className="text-[10px] font-body text-content-tertiary mt-0.5">
                    {sp.category}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent conversations */}
        <section>
          <h2 className="text-[13px] font-display font-semibold text-content-tertiary uppercase tracking-wider mb-3 px-1">
            Recent threads
          </h2>
          <div className="space-y-2">
            {recentConversations.slice(0, 3).map((conv, i) => (
              <button
                key={conv.id}
                className="animate-fade-up w-full bg-surface-elevated rounded-card shadow-card px-4 py-3.5 text-left flex items-center gap-3 active:bg-surface-muted transition-colors"
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0">
                  <Mail size={15} strokeWidth={1.75} className="text-content-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-body font-medium text-content-primary truncate">
                    {conv.title}
                  </p>
                  <p className="text-[11px] font-body text-content-tertiary mt-0.5">
                    {conv.messageCount} messages · {conv.timestamp}
                  </p>
                </div>
                <span className={`text-[9px] font-display font-semibold px-2 py-1 rounded-full ${
                  conv.modelProvider === 'OpenAI'
                    ? 'bg-emerald-50 text-emerald-700'
                    : conv.modelProvider === 'Anthropic'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {conv.model}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
