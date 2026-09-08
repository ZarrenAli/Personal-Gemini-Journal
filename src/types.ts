export type ReflectionMode = 'insight' | 'brainstorm' | 'summary' | 'compassion';

export interface JournalMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  reflectionMode?: ReflectionMode;
  modelUsed?: string;
}

export interface JournalSummaryData {
  summary: string;
  keyTakeaways: string[];
  sentiment: string;
  actionItems: string[];
  sentimentSummary?: string;
  sentimentScore?: number; // 0 - 100
  sentimentKeywords?: string[];
  moodCategory?: 'calm' | 'uplifted' | 'reflective' | 'vulnerable' | 'unsettled' | 'neutral';
  modelUsed?: string;
  timestamp?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: JournalMessage[];
  summary?: string;
  keyTakeaways?: string[];
  sentiment?: string;
  sentimentSummary?: string;
  sentimentScore?: number;
  sentimentKeywords?: string[];
  moodCategory?: 'calm' | 'uplifted' | 'reflective' | 'vulnerable' | 'unsettled' | 'neutral';
  actionItems?: string[];
  tags?: string[];
}

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Mindful Cycle Companion Types
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type FlowIntensity = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export interface CycleLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  cycleDay: number;
  phase: CyclePhase;
  flow: FlowIntensity;
  symptoms: string[];
  moods: string[];
  notes?: string;
  geminiAdvice?: string;
  timestamp: string;
}

export interface CycleSettings {
  enabled: boolean;
  averageCycleLength: number;
  averagePeriodLength: number;
  lastPeriodStartDate: string; // YYYY-MM-DD
}

export interface UserPreferences {
  enableCycleCompanion: boolean;
  onboardingDismissed: boolean;
  monumentTheme?: 'rose' | 'twilight' | 'sand' | 'teal';
}
