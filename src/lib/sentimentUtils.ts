import React from 'react';
import {
  Sun,
  Moon,
  Heart,
  Sparkles,
  Feather,
  Leaf,
  CloudSun,
  CloudRain,
  Brain,
  Smile,
  Compass,
  Wind,
  HelpCircle,
} from 'lucide-react';

export type MoodCategoryType = 'calm' | 'uplifted' | 'reflective' | 'vulnerable' | 'unsettled' | 'neutral';

export interface MoodVisual {
  label: string;
  category: MoodCategoryType;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  ringColor: string;
  cardBg: string;
  cardBorder: string;
  description: string;
}

const DEFAULT_NEUTRAL_VISUAL: MoodVisual = {
  label: 'Unanalyzed',
  category: 'neutral',
  icon: Sparkles,
  iconColor: 'text-rose-400',
  iconBg: 'bg-rose-50',
  badgeBg: 'bg-rose-50/70',
  badgeText: 'text-rose-700',
  badgeBorder: 'border-rose-200/60',
  dotColor: 'bg-rose-300',
  ringColor: 'ring-rose-200/50',
  cardBg: 'bg-rose-50/40',
  cardBorder: 'border-rose-100',
  description: 'Awaiting sentiment synthesis with Gemini',
};

export function getMoodVisual(sentiment?: string | null, moodCategory?: MoodCategoryType | string | null): MoodVisual {
  if (!sentiment && !moodCategory) {
    return DEFAULT_NEUTRAL_VISUAL;
  }

  const s = (sentiment || '').toLowerCase().trim();
  const c = (moodCategory || '').toLowerCase().trim();

  // 1. Calm / Peaceful / Grounded / Serene / Zen / Restful
  if (
    c === 'calm' ||
    s.includes('calm') ||
    s.includes('peace') ||
    s.includes('grounded') ||
    s.includes('serene') ||
    s.includes('zen') ||
    s.includes('centered') ||
    s.includes('content') ||
    s.includes('restful') ||
    s.includes('ease')
  ) {
    return {
      label: sentiment || 'Calm & Grounded',
      category: 'calm',
      icon: Leaf,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      badgeBg: 'bg-emerald-50/90',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-200',
      dotColor: 'bg-emerald-500',
      ringColor: 'ring-emerald-300/60',
      cardBg: 'bg-emerald-50/40',
      cardBorder: 'border-emerald-200/80',
      description: 'Inner equilibrium, grounded peace, and relaxed clarity',
    };
  }

  // 2. Uplifted / Joyful / Optimistic / Bright / Energetic / Hopeful / Flow
  if (
    c === 'uplifted' ||
    s.includes('joy') ||
    s.includes('optimis') ||
    s.includes('bright') ||
    s.includes('energi') ||
    s.includes('hope') ||
    s.includes('excite') ||
    s.includes('flow') ||
    s.includes('motivat') ||
    s.includes('inspir') ||
    s.includes('happy')
  ) {
    return {
      label: sentiment || 'Joyful & Uplifted',
      category: 'uplifted',
      icon: Sun,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      badgeBg: 'bg-amber-50/90',
      badgeText: 'text-amber-900',
      badgeBorder: 'border-amber-200',
      dotColor: 'bg-amber-500',
      ringColor: 'ring-amber-300/60',
      cardBg: 'bg-amber-50/40',
      cardBorder: 'border-amber-200/80',
      description: 'Positive vitality, bright inspiration, and expansive energy',
    };
  }

  // 3. Loving / Grateful / Compassion / Tender
  if (
    s.includes('grate') ||
    s.includes('love') ||
    s.includes('compassion') ||
    s.includes('tender') ||
    s.includes('warm') ||
    s.includes('kind')
  ) {
    return {
      label: sentiment || 'Grateful & Loving',
      category: 'calm',
      icon: Heart,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
      badgeBg: 'bg-rose-100/90',
      badgeText: 'text-rose-900',
      badgeBorder: 'border-rose-300/80',
      dotColor: 'bg-rose-500',
      ringColor: 'ring-rose-300/60',
      cardBg: 'bg-rose-50/50',
      cardBorder: 'border-rose-200/80',
      description: 'Heart-centered gratitude, warmth, and self-compassion',
    };
  }

  // 4. Reflective / Contemplative / Insightful / Deep / Curious / Analytical
  if (
    c === 'reflective' ||
    s.includes('contemplat') ||
    s.includes('reflect') ||
    s.includes('insight') ||
    s.includes('deep') ||
    s.includes('curious') ||
    s.includes('ponder') ||
    s.includes('analy') ||
    s.includes('philosoph')
  ) {
    return {
      label: sentiment || 'Contemplative',
      category: 'reflective',
      icon: Moon,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      badgeBg: 'bg-indigo-50/90',
      badgeText: 'text-indigo-900',
      badgeBorder: 'border-indigo-200',
      dotColor: 'bg-indigo-500',
      ringColor: 'ring-indigo-300/60',
      cardBg: 'bg-indigo-50/40',
      cardBorder: 'border-indigo-200/80',
      description: 'Deep inquiry, introspective stillness, and thoughtful discernment',
    };
  }

  // 5. Unsettled / Anxious / Overwhelmed / Restless / Frustrated
  if (
    c === 'unsettled' ||
    s.includes('anxious') ||
    s.includes('overwhelm') ||
    s.includes('stress') ||
    s.includes('restless') ||
    s.includes('frustrat') ||
    s.includes('turbulen') ||
    s.includes('tensi')
  ) {
    return {
      label: sentiment || 'Unsettled & Processing',
      category: 'unsettled',
      icon: CloudRain,
      iconColor: 'text-rose-700',
      iconBg: 'bg-rose-100/80',
      badgeBg: 'bg-rose-100/95',
      badgeText: 'text-rose-950',
      badgeBorder: 'border-rose-300',
      dotColor: 'bg-rose-600',
      ringColor: 'ring-rose-400/60',
      cardBg: 'bg-rose-100/30',
      cardBorder: 'border-rose-200',
      description: 'Navigating nervous system friction, seeking space to decompress',
    };
  }

  // 6. Vulnerable / Processing / Fatigued / Melancholy / Tired
  if (
    c === 'vulnerable' ||
    s.includes('vulnerab') ||
    s.includes('process') ||
    s.includes('fatigue') ||
    s.includes('tired') ||
    s.includes('exhaust') ||
    s.includes('sad') ||
    s.includes('grief') ||
    s.includes('heavy')
  ) {
    return {
      label: sentiment || 'Tender & Processing',
      category: 'vulnerable',
      icon: CloudSun,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50',
      badgeBg: 'bg-sky-50/90',
      badgeText: 'text-sky-900',
      badgeBorder: 'border-sky-200',
      dotColor: 'bg-sky-500',
      ringColor: 'ring-sky-300/60',
      cardBg: 'bg-sky-50/40',
      cardBorder: 'border-sky-200/80',
      description: 'Gentle vulnerability, honoring energy levels, and emotional digestion',
    };
  }

  // Generic fallback if sentiment has custom text
  return {
    label: sentiment || 'Reflective',
    category: 'reflective',
    icon: Compass,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    badgeBg: 'bg-purple-50/90',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-200',
    dotColor: 'bg-purple-500',
    ringColor: 'ring-purple-300/60',
    cardBg: 'bg-purple-50/40',
    cardBorder: 'border-purple-200/80',
    description: 'Thoughtful self-observation and inner mindful inquiry',
  };
}
