import React, { useMemo } from 'react';
import {
  Activity,
  Sparkles,
  TrendingUp,
  Tag,
  Heart,
  Calendar,
  Smile,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { JournalEntry, CycleSettings } from '../types';
import { EmotionalProgressionChart } from './EmotionalProgressionChart';
import { MonumentRealmTheme, getRealmTheme } from '../lib/realmTheme';

interface WellbeingDashboardProps {
  entries: JournalEntry[];
  onNewReflection: () => void;
  onOpenVoiceModal: () => void;
  cycleSettings?: CycleSettings;
  onNavigateToCycle?: () => void;
  monumentTheme?: MonumentRealmTheme;
}

export const WellbeingDashboard: React.FC<WellbeingDashboardProps> = ({
  entries,
  onNewReflection,
  onOpenVoiceModal,
  cycleSettings,
  onNavigateToCycle,
  monumentTheme = 'rose',
}) => {
  const theme = getRealmTheme(monumentTheme);

  // Aggregate stats from the last 30 days
  const analytics = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEntries = entries.filter((e) => {
      if (!e.createdAt) return false;
      return new Date(e.createdAt) >= thirtyDaysAgo;
    });

    const totalWords = recentEntries.reduce((acc, entry) => {
      const msgWords = entry.messages?.reduce((mAcc, m) => mAcc + (m.text?.split(/\s+/).length || 0), 0) || 0;
      return acc + msgWords;
    }, 0);

    const voiceEntriesCount = recentEntries.filter(
      (e) => e.tags?.includes('Voice Journal') || e.tags?.includes('Live API')
    ).length;

    // Collect all tags
    const tagFrequencies: Record<string, number> = {};
    recentEntries.forEach((e) => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach((t) => {
          tagFrequencies[t] = (tagFrequencies[t] || 0) + 1;
        });
      }
      if (e.sentiment) {
        tagFrequencies[e.sentiment] = (tagFrequencies[e.sentiment] || 0) + 1;
      }
    });

    const sortedTags = Object.entries(tagFrequencies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      recentCount: recentEntries.length,
      totalWords,
      voiceEntriesCount,
      topTags: sortedTags,
    };
  }, [entries]);

  return (
    <div
      id="wellbeing-dashboard-view"
      className={`flex-1 h-full overflow-y-auto bg-transparent ${theme.textPrimary} p-6 md:p-10 space-y-8 no-scrollbar relative z-10`}
    >
      {/* Top Banner & Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b ${theme.cardBorder}`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl ${theme.accentIconBg} border ${theme.accentIconBorder} flex items-center justify-center ${theme.accentIconColor} shadow-sm backdrop-blur-md`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl md:text-2xl font-serif font-semibold ${theme.textPrimary}`}>
                Wellbeing & Emotional Progression
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${theme.accentBadge}`}>
                30-Day Analysis
              </span>
            </div>
            <p className={`text-xs ${theme.textSecondary} mt-0.5`}>
              Longitudinal emotional states derived from your journal tags, voice transcripts, and reflections
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            id="wellbeing-start-voice-btn"
            type="button"
            onClick={onOpenVoiceModal}
            className={`px-3.5 py-1.5 rounded-xl ${theme.secondaryBtn} text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${theme.accentIconColor}`} />
            <span>Voice Reflection</span>
          </button>
          <button
            id="wellbeing-new-entry-btn"
            type="button"
            onClick={onNewReflection}
            className={`px-4 py-1.5 rounded-xl ${theme.primaryBtn} text-xs font-medium transition-all cursor-pointer shadow-xs`}
          >
            New Journal Entry
          </button>
        </div>
      </div>

      {/* Primary Recharts Line Chart for 30-Day Progression */}
      <EmotionalProgressionChart entries={entries} daysCount={30} monumentTheme={monumentTheme} />

      {/* Secondary Metrics & Tag Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reflection Volume & Cadence */}
        <div className={`rounded-3xl ${theme.cardBg} border ${theme.cardBorder} p-6 backdrop-blur-xl space-y-4 shadow-sm`}>
          <div className={`flex items-center justify-between border-b ${theme.cardBorder} pb-3`}>
            <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textPrimary} flex items-center gap-1.5`}>
              <BookOpen className={`w-3.5 h-3.5 ${theme.accentIconColor}`} />
              <span>Reflection Cadence</span>
            </span>
            <span className={`text-[10px] ${theme.textMuted} font-mono`}>Past 30 Days</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${theme.textSecondary}`}>Total Entries Recorded:</span>
              <span className={`text-sm font-bold ${theme.textPrimary} font-mono`}>
                {analytics.recentCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${theme.textSecondary}`}>Spoken Voice Sessions:</span>
              <span className={`text-sm font-bold ${theme.accentIconColor} font-mono`}>
                {analytics.voiceEntriesCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${theme.textSecondary}`}>Reflective Words Processed:</span>
              <span className={`text-sm font-bold ${theme.textPrimary} font-mono`}>
                ~{analytics.totalWords.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Top Active Tags Breakdown */}
        <div className={`rounded-3xl ${theme.cardBg} border ${theme.cardBorder} p-6 backdrop-blur-xl space-y-4 md:col-span-2 shadow-sm`}>
          <div className={`flex items-center justify-between border-b ${theme.cardBorder} pb-3`}>
            <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textPrimary} flex items-center gap-1.5`}>
              <Tag className={`w-3.5 h-3.5 ${theme.accentIconColor}`} />
              <span>Emotional & Topic Tag Distributions</span>
            </span>
            <span className={`text-[10px] ${theme.textMuted} font-mono`}>Journal Grounding</span>
          </div>

          {analytics.topTags.length === 0 ? (
            <p className={`text-xs ${theme.textMuted} py-3`}>
              No journal tags logged yet. As you converse with Gemini or tag your reflections, your emotional distribution will appear here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {analytics.topTags.map(([tagName, count]) => (
                <div
                  key={tagName}
                  className={`px-3 py-1.5 rounded-xl bg-white/90 border ${theme.cardBorder} flex items-center gap-2 text-xs shadow-2xs`}
                >
                  <span className={`${theme.textPrimary} font-medium`}>#{tagName}</span>
                  <span className={`px-1.5 py-0.5 rounded-full ${theme.accentBadge} text-[10px] font-mono font-semibold`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cycle Companion Quick Link if enabled */}
      {cycleSettings?.enabled && onNavigateToCycle && (
        <div className={`rounded-3xl ${theme.cardBg} border ${theme.cardBorder} p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${theme.accentIconBg} border ${theme.accentIconBorder} ${theme.accentIconColor} flex items-center justify-center`}>
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-sm font-serif font-semibold ${theme.textPrimary}`}>
                Mindful Cycle Companion Connected
              </h4>
              <p className={`text-xs ${theme.textSecondary}`}>
                Pair emotional progression with somatic hormonal phase awareness.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToCycle}
            className={`px-4 py-2 rounded-xl ${theme.secondaryBtn} text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-2xs`}
          >
            <span>Open Cycle Tracker</span>
            <ArrowUpRight className={`w-3.5 h-3.5 ${theme.accentIconColor}`} />
          </button>
        </div>
      )}
    </div>
  );
};
