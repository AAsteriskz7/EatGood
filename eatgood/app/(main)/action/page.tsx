'use client';

import { useState } from 'react';
import { useMockData } from '@/context/MockDataContext';
import {
  ArrowUp,
  ChevronDown,
  FileText,
  BarChart2,
  Code2,
  MessageSquare,
  Lightbulb,
  Globe,
  CheckCheck,
  Paperclip,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AIModel } from '@/context/MockDataContext';

// ─── Prompt category icons ────────────────────────────────────────────────────

const PROMPT_ICONS: Record<string, React.ElementType> = {
  Productivity: CheckCheck,
  Writing:      FileText,
  Analysis:     BarChart2,
  Engineering:  Code2,
  Strategy:     Globe,
};

function PromptIcon({ category }: { category: string }) {
  const Icon = PROMPT_ICONS[category] ?? Lightbulb;
  return <Icon size={16} strokeWidth={1.75} />;
}

// ─── Model Selector ───────────────────────────────────────────────────────────
// Rule 06 + Rule 11: provider names carry meaning — color does not add information.
// Every model uses the same neutral token treatment. No per-provider accent colors.

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
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-border active:bg-border transition-colors"
      >
        <span className="type-label text-foreground font-semibold">{current.name}</span>
        <Badge variant="secondary" className="type-micro px-1.5 py-0 h-auto rounded-sm">
          {current.badge}
        </Badge>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={[
            'text-muted-foreground transition-transform duration-150',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <Card className="absolute top-full left-0 mt-2 w-72 z-20 animate-scale-in p-0 overflow-hidden">
            <CardContent className="p-0 divide-y divide-border">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => { onSelect(model.id); setOpen(false); }}
                  className={[
                    'w-full flex items-start gap-3 px-4 py-4 text-left transition-colors',
                    model.id === activeId ? 'bg-secondary' : 'hover:bg-muted active:bg-muted',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="type-label text-foreground font-semibold">{model.name}</span>
                      <Badge variant="secondary" className="type-micro px-1.5 py-0 h-auto rounded-sm">
                        {model.badge}
                      </Badge>
                      {model.id === activeId && (
                        <CheckCheck size={13} strokeWidth={2} className="text-primary ml-auto flex-shrink-0" />
                      )}
                    </div>
                    <p className="type-caption text-muted-foreground mt-1 leading-snug">
                      {model.description}
                    </p>
                    <p className="type-micro text-muted-foreground mt-1">
                      Context: {model.contextWindow} tokens
                    </p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
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
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-screen pt-14 pb-5">
        <h1 className="type-heading text-foreground">Compose</h1>
        <p className="type-caption text-muted-foreground mt-1">
          Start a new AI conversation
        </p>
      </header>

      <div className="flex-1 px-screen py-5 flex flex-col gap-section pb-nav">

        {/* ── Compose card ── */}
        <Card className="overflow-hidden">
          {/* Model selector row */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
            <span className="type-micro text-muted-foreground uppercase tracking-wider">Model</span>
            <ModelSelector models={models} activeId={activeModel} onSelect={setActiveModel} />
          </div>

          {/* Textarea — Rule 04: body text role */}
          <CardContent className="pt-4 pb-0 px-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What do you want to work on today?"
              rows={5}
              className="type-body w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed"
            />
          </CardContent>

          {/* Toolbar — Rule 06: send button uses primary only when actionable */}
          <div className="flex items-center justify-between px-4 pb-4 pt-2">
            <button className="flex items-center gap-2 type-caption text-muted-foreground active:text-foreground transition-colors">
              <Paperclip size={18} strokeWidth={1.75} />
              Attach
            </button>
            <button
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150',
                hasInput
                  ? 'bg-primary shadow-action active:scale-95'
                  : 'bg-muted cursor-not-allowed',
              ].join(' ')}
              disabled={!hasInput}
            >
              <ArrowUp
                size={20}
                strokeWidth={2.25}
                className={hasInput ? 'text-primary-foreground' : 'text-muted-foreground'}
              />
            </button>
          </div>
        </Card>

        {/* ── Suggested prompts ── */}
        <section>
          <h2 className="type-micro text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Suggestions
          </h2>
          <div className="grid grid-cols-2 gap-cols">
            {suggestedPrompts.map((sp, i) => (
              <button
                key={sp.id}
                onClick={() => setPrompt(sp.text)}
                className="animate-fade-up text-left active:opacity-80 transition-opacity"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Card className="h-full">
                  <CardContent className="flex items-start gap-3 pt-4">
                    {/* Rule 06: brand accent on the icon only — one accent per card */}
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5 text-primary">
                      <PromptIcon category={sp.category} />
                    </div>
                    <div className="min-w-0">
                      <p className="type-label text-foreground leading-snug">{sp.text}</p>
                      <p className="type-micro text-muted-foreground mt-1">{sp.category}</p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </section>

        {/* ── Recent threads ── */}
        <section>
          <h2 className="type-micro text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Recent threads
          </h2>
          <div className="flex flex-col gap-list">
            {recentConversations.slice(0, 3).map((conv, i) => (
              <button
                key={conv.id}
                className="animate-fade-up w-full text-left active:opacity-80 transition-opacity"
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <Card>
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={15} strokeWidth={1.75} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="type-label text-foreground truncate">{conv.title}</p>
                      <p className="type-micro text-muted-foreground mt-0.5">
                        {conv.messageCount} messages · {conv.timestamp}
                      </p>
                    </div>
                    {/* Rule 06: neutral badge for all models — no per-provider color */}
                    <Badge variant="secondary" className="type-micro shrink-0">
                      {conv.model}
                    </Badge>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
