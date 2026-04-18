'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plan = 'Free' | 'Pro' | 'Team';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ModelProvider = 'OpenAI' | 'Anthropic' | 'Google';

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  plan: Plan;
  joinedDate: string;
  timezone: string;
}

export interface Stats {
  totalConversations: number;
  tokensUsed: number;
  tasksCompleted: number;
  streakDays: number;
  tokenLimit: number;
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  model: string;
  modelProvider: ModelProvider;
  timestamp: string;
  messageCount: number;
  isPinned: boolean;
  tags: string[];
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  project: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  badge: string;
  contextWindow: string;
  description: string;
}

export interface SuggestedPrompt {
  id: string;
  text: string;
  category: string;
}

export interface UsagePoint {
  date: string;
  tokens: number;
  conversations: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning';
  message: string;
  time: string;
  read: boolean;
}

export interface MockData {
  user: User;
  stats: Stats;
  recentConversations: Conversation[];
  tasks: Task[];
  models: AIModel[];
  suggestedPrompts: SuggestedPrompt[];
  usageHistory: UsagePoint[];
  notifications: Notification[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DATA: MockData = {
  user: {
    id: 'usr_01',
    name: 'Alex Rivera',
    email: 'alex.rivera@studio.io',
    initials: 'AR',
    plan: 'Pro',
    joinedDate: 'January 2024',
    timezone: 'PST',
  },

  stats: {
    totalConversations: 248,
    tokensUsed: 1_840_500,
    tasksCompleted: 34,
    streakDays: 12,
    tokenLimit: 5_000_000,
  },

  recentConversations: [
    {
      id: 'conv_01',
      title: 'Quarterly report analysis',
      preview: 'Summarize the Q3 revenue trends and flag anomalies across regions.',
      model: 'GPT-4o',
      modelProvider: 'OpenAI',
      timestamp: '2 min ago',
      messageCount: 14,
      isPinned: true,
      tags: ['Finance', 'Reports'],
    },
    {
      id: 'conv_02',
      title: 'Email campaign strategy',
      preview: 'Draft a 5-part drip sequence for the October product launch.',
      model: 'Claude 3.5',
      modelProvider: 'Anthropic',
      timestamp: '1 hr ago',
      messageCount: 8,
      isPinned: false,
      tags: ['Marketing'],
    },
    {
      id: 'conv_03',
      title: 'TypeScript refactor review',
      preview: 'Review this service layer for potential memory leaks and race conditions.',
      model: 'GPT-4o',
      modelProvider: 'OpenAI',
      timestamp: '3 hr ago',
      messageCount: 22,
      isPinned: false,
      tags: ['Engineering', 'Code'],
    },
    {
      id: 'conv_04',
      title: 'Content calendar — November',
      preview: 'Create a 30-day social media plan aligned with upcoming product milestones.',
      model: 'Claude 3.5',
      modelProvider: 'Anthropic',
      timestamp: 'Yesterday',
      messageCount: 6,
      isPinned: false,
      tags: ['Content'],
    },
    {
      id: 'conv_05',
      title: 'Competitor positioning deep-dive',
      preview: 'Synthesize positioning data from the three main competitors into a matrix.',
      model: 'Gemini Pro',
      modelProvider: 'Google',
      timestamp: 'Yesterday',
      messageCount: 11,
      isPinned: false,
      tags: ['Strategy', 'Research'],
    },
    {
      id: 'conv_06',
      title: 'Investor update draft',
      preview: 'Write a concise monthly investor update covering metrics and milestones.',
      model: 'GPT-4o',
      modelProvider: 'OpenAI',
      timestamp: '2 days ago',
      messageCount: 9,
      isPinned: false,
      tags: ['Finance'],
    },
  ],

  tasks: [
    {
      id: 'task_01',
      title: 'Review AI-generated product proposal',
      status: 'in_progress',
      priority: 'high',
      dueDate: 'Today',
      project: 'Client Work',
    },
    {
      id: 'task_02',
      title: 'Update system prompt library',
      status: 'todo',
      priority: 'medium',
      dueDate: 'Tomorrow',
      project: 'Internal',
    },
    {
      id: 'task_03',
      title: 'Analyze weekly usage report',
      status: 'todo',
      priority: 'low',
      dueDate: 'Fri',
      project: 'Analytics',
    },
    {
      id: 'task_04',
      title: 'Onboard two new team members',
      status: 'completed',
      priority: 'medium',
      dueDate: 'Done',
      project: 'Team',
    },
    {
      id: 'task_05',
      title: 'Set up shared workspace templates',
      status: 'completed',
      priority: 'low',
      dueDate: 'Done',
      project: 'Internal',
    },
  ],

  models: [
    {
      id: 'gpt4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      badge: 'Fast',
      contextWindow: '128K',
      description: 'Balanced speed and intelligence for most tasks.',
    },
    {
      id: 'claude35',
      name: 'Claude 3.5',
      provider: 'Anthropic',
      badge: 'Smart',
      contextWindow: '200K',
      description: 'Deep reasoning and nuanced long-form writing.',
    },
    {
      id: 'gemini',
      name: 'Gemini Pro',
      provider: 'Google',
      badge: 'New',
      contextWindow: '1M',
      description: 'Massive context window for complex document work.',
    },
  ],

  suggestedPrompts: [
    { id: 'sp_01', text: 'Summarize my last meeting notes', category: 'Productivity' },
    { id: 'sp_02', text: 'Draft a client proposal', category: 'Writing' },
    { id: 'sp_03', text: 'Analyze this data and find trends', category: 'Analysis' },
    { id: 'sp_04', text: 'Review and refactor my code', category: 'Engineering' },
    { id: 'sp_05', text: 'Write a weekly status update', category: 'Productivity' },
    { id: 'sp_06', text: 'Research competitor strategies', category: 'Strategy' },
  ],

  usageHistory: [
    { date: 'Mon', tokens: 240_000, conversations: 18 },
    { date: 'Tue', tokens: 185_000, conversations: 14 },
    { date: 'Wed', tokens: 420_000, conversations: 31 },
    { date: 'Thu', tokens: 360_000, conversations: 26 },
    { date: 'Fri', tokens: 290_000, conversations: 21 },
    { date: 'Sat', tokens: 175_000, conversations: 13 },
    { date: 'Sun', tokens: 124_000, conversations: 9 },
  ],

  notifications: [
    {
      id: 'notif_01',
      type: 'info',
      message: 'GPT-4.1 is now available on your plan.',
      time: '10 min ago',
      read: false,
    },
    {
      id: 'notif_02',
      type: 'success',
      message: 'Monthly usage report is ready to download.',
      time: '2 hr ago',
      read: false,
    },
    {
      id: 'notif_03',
      type: 'warning',
      message: 'You have used 37% of your monthly token quota.',
      time: 'Yesterday',
      read: true,
    },
  ],
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface MockDataContextValue {
  data: MockData;
  activeModel: string;
  setActiveModel: (id: string) => void;
  unreadNotifications: number;
}

const MockDataContext = createContext<MockDataContextValue | null>(null);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [activeModel, setActiveModel] = useState('gpt4o');

  const unreadNotifications = MOCK_DATA.notifications.filter((n) => !n.read).length;

  return (
    <MockDataContext.Provider
      value={{ data: MOCK_DATA, activeModel, setActiveModel, unreadNotifications }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const ctx = useContext(MockDataContext);
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider');
  return ctx;
}
