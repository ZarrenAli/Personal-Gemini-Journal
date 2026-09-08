import { JournalMessage, JournalSummaryData, ReflectionMode } from '../types';

export interface ReflectResponse {
  reply: string;
  modelUsed: string;
  timestamp: string;
}

export async function requestReflection(params: {
  prompt: string;
  conversationHistory: JournalMessage[];
  reflectionMode: ReflectionMode;
  title: string;
}): Promise<ReflectResponse> {
  const response = await fetch('/api/gemini/reflect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned status ${response.status}`);
  }

  return response.json();
}

export async function requestSummary(params: {
  title: string;
  messages: JournalMessage[];
  entryText?: string;
}): Promise<JournalSummaryData> {
  const response = await fetch('/api/gemini/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to generate reflection summary (${response.status})`);
  }

  return response.json();
}

export async function requestSentimentAnalysis(params: {
  title: string;
  messages?: JournalMessage[];
  entryText?: string;
}): Promise<JournalSummaryData> {
  const response = await fetch('/api/gemini/sentiment-analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to analyze entry sentiment (${response.status})`);
  }

  return response.json();
}

export async function requestCycleCoach(params: {
  phase: string;
  cycleDay: number;
  flow: string;
  symptoms: string[];
  moods: string[];
  notes?: string;
}): Promise<{ advice: string; modelUsed: string; timestamp: string }> {
  const response = await fetch('/api/gemini/cycle-coach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to consult Cycle Coach (${response.status})`);
  }

  return response.json();
}

