import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { JournalEntry } from '../types';
import { Sparkles, TrendingUp, Tag, Heart, Activity, Calendar } from 'lucide-react';
import { MonumentRealmTheme, getRealmTheme } from '../lib/realmTheme';

interface EmotionalProgressionChartProps {
  entries: JournalEntry[];
  daysCount?: number;
  monumentTheme?: MonumentRealmTheme;
}

// Map common emotional tags and modes to emotional dimensions & scores
const EMOTIONAL_TAG_WEIGHTS: Record<string, { valence: number; dimension: 'harmony' | 'vitality' | 'clarity' | 'stress' }> = {
  // Harmony / Calm (Score 70-100)
  calm: { valence: 85, dimension: 'harmony' },
  peaceful: { valence: 90, dimension: 'harmony' },
  grounded: { valence: 80, dimension: 'harmony' },
  grateful: { valence: 95, dimension: 'harmony' },
  compassion: { valence: 85, dimension: 'harmony' },
  centered: { valence: 85, dimension: 'harmony' },
  zen: { valence: 90, dimension: 'harmony' },
  content: { valence: 80, dimension: 'harmony' },
  love: { valence: 95, dimension: 'harmony' },

  // Vitality / Energy (Score 75-100)
  energetic: { valence: 90, dimension: 'vitality' },
  bright: { valence: 85, dimension: 'vitality' },
  motivated: { valence: 90, dimension: 'vitality' },
  brainstorm: { valence: 80, dimension: 'vitality' },
  excited: { valence: 92, dimension: 'vitality' },
  flow: { valence: 88, dimension: 'vitality' },
  joyful: { valence: 95, dimension: 'vitality' },
  hopeful: { valence: 85, dimension: 'vitality' },

  // Clarity / Focus (Score 70-95)
  insight: { valence: 80, dimension: 'clarity' },
  focused: { valence: 85, dimension: 'clarity' },
  synthesis: { valence: 75, dimension: 'clarity' },
  reflective: { valence: 75, dimension: 'clarity' },
  mindful: { valence: 85, dimension: 'clarity' },
  clarity: { valence: 90, dimension: 'clarity' },
  productive: { valence: 85, dimension: 'clarity' },
  deep: { valence: 75, dimension: 'clarity' },

  // Stress / Sensitivity (Valence 25-50)
  anxious: { valence: 35, dimension: 'stress' },
  overwhelmed: { valence: 30, dimension: 'stress' },
  irritable: { valence: 35, dimension: 'stress' },
  vulnerable: { valence: 50, dimension: 'stress' },
  tender: { valence: 55, dimension: 'stress' },
  sensitive: { valence: 55, dimension: 'stress' },
  fatigue: { valence: 40, dimension: 'stress' },
  tired: { valence: 45, dimension: 'stress' },
  restless: { valence: 40, dimension: 'stress' },
  sad: { valence: 35, dimension: 'stress' },
  grief: { valence: 30, dimension: 'stress' },
  confused: { valence: 45, dimension: 'stress' },
};

export const EmotionalProgressionChart: React.FC<EmotionalProgressionChartProps> = ({
  entries,
  daysCount = 30,
  monumentTheme = 'rose',
}) => {
  const theme = getRealmTheme(monumentTheme);
  const [selectedDimension, setSelectedDimension] = useState<'all' | 'harmony' | 'vitality' | 'clarity' | 'stress'>('all');

  // Process entries over the last 30 days
  const { chartData, stats } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const daysMap = new Map<
      string,
      {
        dateStr: string;
        displayDate: string;
        scores: number[];
        harmonyScores: number[];
        vitalityScores: number[];
        clarityScores: number[];
        stressScores: number[];
        tags: string[];
        entryCount: number;
      }
    >();

    // Initialize past 30 days
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      daysMap.set(dateKey, {
        dateStr: dateKey,
        displayDate,
        scores: [],
        harmonyScores: [],
        vitalityScores: [],
        clarityScores: [],
        stressScores: [],
        tags: [],
        entryCount: 0,
      });
    }

    const tagCounts: Record<string, number> = {};
    let totalScoreSum = 0;
    let scoreDataPoints = 0;

    // Scan all user journal entries
    entries.forEach((entry) => {
      const entryDate = entry.createdAt ? entry.createdAt.split('T')[0] : '';
      if (!daysMap.has(entryDate)) return;

      const dayRecord = daysMap.get(entryDate)!;
      dayRecord.entryCount += 1;

      // Extract all tags and reflection modes
      const rawTags: string[] = [];
      if (Array.isArray(entry.tags)) {
        rawTags.push(...entry.tags);
      }
      if (entry.sentiment) {
        rawTags.push(entry.sentiment);
      }
      if (Array.isArray(entry.messages)) {
        entry.messages.forEach((m) => {
          if (m.reflectionMode) rawTags.push(m.reflectionMode);
        });
      }

      // Default baseline score for engaging in reflection
      let dayValence = 70;
      let tagWeightsFound = 0;

      rawTags.forEach((t) => {
        const cleanTag = t.toLowerCase().trim();
        if (!cleanTag) return;

        // Track frequency
        tagCounts[t] = (tagCounts[t] || 0) + 1;
        if (!dayRecord.tags.includes(t)) {
          dayRecord.tags.push(t);
        }

        const match = EMOTIONAL_TAG_WEIGHTS[cleanTag];
        if (match) {
          tagWeightsFound++;
          if (match.dimension === 'harmony') dayRecord.harmonyScores.push(match.valence);
          if (match.dimension === 'vitality') dayRecord.vitalityScores.push(match.valence);
          if (match.dimension === 'clarity') dayRecord.clarityScores.push(match.valence);
          if (match.dimension === 'stress') dayRecord.stressScores.push(100 - match.valence); // Invert stress for stress line
          dayValence += match.valence;
        }
      });

      if (tagWeightsFound > 0) {
        dayValence = Math.round(dayValence / (tagWeightsFound + 1));
      }

      // Constrain score 15 - 100
      const boundedScore = Math.max(15, Math.min(100, dayValence));
      dayRecord.scores.push(boundedScore);
      totalScoreSum += boundedScore;
      scoreDataPoints++;
    });

    // Build interpolated/continuous line data
    let lastKnownOverall = 70;
    let lastKnownHarmony = 72;
    let lastKnownVitality = 68;
    let lastKnownClarity = 75;
    let lastKnownStress = 25;

    const data = Array.from(daysMap.values()).map((day) => {
      const hasEntries = day.scores.length > 0;
      let overallScore: number;
      let harmonyScore: number;
      let vitalityScore: number;
      let clarityScore: number;
      let stressScore: number;

      if (hasEntries) {
        overallScore = Math.round(day.scores.reduce((a, b) => a + b, 0) / day.scores.length);
        harmonyScore = day.harmonyScores.length > 0
          ? Math.round(day.harmonyScores.reduce((a, b) => a + b, 0) / day.harmonyScores.length)
          : Math.min(100, Math.round(overallScore * 0.95));

        vitalityScore = day.vitalityScores.length > 0
          ? Math.round(day.vitalityScores.reduce((a, b) => a + b, 0) / day.vitalityScores.length)
          : Math.min(100, Math.round(overallScore * 0.92));

        clarityScore = day.clarityScores.length > 0
          ? Math.round(day.clarityScores.reduce((a, b) => a + b, 0) / day.clarityScores.length)
          : Math.min(100, Math.round(overallScore * 0.98));

        stressScore = day.stressScores.length > 0
          ? Math.round(day.stressScores.reduce((a, b) => a + b, 0) / day.stressScores.length)
          : Math.max(10, 100 - overallScore);

        lastKnownOverall = overallScore;
        lastKnownHarmony = harmonyScore;
        lastKnownVitality = vitalityScore;
        lastKnownClarity = clarityScore;
        lastKnownStress = stressScore;
      } else {
        // Subtle drift towards calm baseline (70)
        overallScore = Math.round(lastKnownOverall * 0.9 + 70 * 0.1);
        harmonyScore = Math.round(lastKnownHarmony * 0.9 + 70 * 0.1);
        vitalityScore = Math.round(lastKnownVitality * 0.9 + 68 * 0.1);
        clarityScore = Math.round(lastKnownClarity * 0.9 + 72 * 0.1);
        stressScore = Math.round(lastKnownStress * 0.9 + 25 * 0.1);
      }

      return {
        date: day.dateStr,
        displayDate: day.displayDate,
        hasEntries,
        entryCount: day.entryCount,
        tags: day.tags,
        overall: overallScore,
        harmony: harmonyScore,
        vitality: vitalityScore,
        clarity: clarityScore,
        stress: stressScore,
      };
    });

    // Top tags sorted
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const avgScore = scoreDataPoints > 0 ? Math.round(totalScoreSum / scoreDataPoints) : 72;

    // Trend calculation (compare first half vs second half)
    const midPoint = Math.floor(data.length / 2);
    const firstHalfAvg = data.slice(0, midPoint).reduce((acc, curr) => acc + curr.overall, 0) / midPoint;
    const secondHalfAvg = data.slice(midPoint).reduce((acc, curr) => acc + curr.overall, 0) / (data.length - midPoint);
    const trendPercentage = Math.round(((secondHalfAvg - firstHalfAvg) / (firstHalfAvg || 1)) * 100);

    return {
      chartData: data,
      stats: {
        avgScore,
        topTags,
        trendPercentage,
        totalEntriesRecorded: scoreDataPoints,
      },
    };
  }, [entries, daysCount]);

  // Custom Chart Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className={`bg-white/95 backdrop-blur-md border ${theme.cardBorder} p-3.5 rounded-2xl shadow-xl text-xs space-y-2 min-w-[190px] ${theme.textPrimary}`}>
          <div className={`flex items-center justify-between gap-3 border-b ${theme.cardBorder} pb-1.5`}>
            <span className={`font-serif font-semibold ${theme.textPrimary}`}>{dataPoint.displayDate}</span>
            {dataPoint.hasEntries ? (
              <span className={`px-2 py-0.5 rounded-full ${theme.accentBadge} text-[10px] font-medium`}>
                {dataPoint.entryCount} reflection{dataPoint.entryCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className={`text-[10px] ${theme.textMuted} italic`}>No direct logs</span>
            )}
          </div>

          <div className="space-y-1">
            <div className={`flex items-center justify-between ${theme.textPrimary}`}>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${theme.accentDot}`} />
                <span>Wellbeing State:</span>
              </span>
              <span className={`font-bold ${theme.textPrimary} font-mono`}>{dataPoint.overall} / 100</span>
            </div>

            {selectedDimension === 'all' && (
              <>
                <div className={`flex items-center justify-between ${theme.textSecondary} text-[11px]`}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.chartSecondaryStroke }} />
                    <span>Calm & Harmony:</span>
                  </span>
                  <span className="font-mono">{dataPoint.harmony}</span>
                </div>
                <div className={`flex items-center justify-between ${theme.textSecondary} text-[11px]`}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.chartMutedStroke }} />
                    <span>Energy & Vitality:</span>
                  </span>
                  <span className="font-mono">{dataPoint.vitality}</span>
                </div>
                <div className={`flex items-center justify-between ${theme.textSecondary} text-[11px]`}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.chartAccentStroke }} />
                    <span>Clarity & Focus:</span>
                  </span>
                  <span className="font-mono">{dataPoint.clarity}</span>
                </div>
              </>
            )}
          </div>

          {dataPoint.tags && dataPoint.tags.length > 0 && (
            <div className={`pt-1.5 border-t ${theme.cardBorder}`}>
              <span className={`text-[10px] ${theme.textMuted} block mb-1`}>Active Journal Tags:</span>
              <div className="flex flex-wrap gap-1">
                {dataPoint.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className={`px-1.5 py-0.5 rounded-md ${theme.pillInactive} text-[10px]`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="emotional-progression-card"
      className={`rounded-3xl ${theme.cardBg} border ${theme.cardBorder} p-5 md:p-7 backdrop-blur-xl space-y-6 relative overflow-hidden shadow-sm`}
    >
      {/* Header & Metric Highlights */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-8 h-8 rounded-xl ${theme.accentIconBg} border ${theme.accentIconBorder} ${theme.accentIconColor} flex items-center justify-center shadow-2xs`}>
              <Activity className="w-4 h-4" />
            </div>
            <h3 className={`text-lg md:text-xl font-serif font-semibold ${theme.textPrimary}`}>
              30-Day Emotional State Progression
            </h3>
          </div>
          <p className={`text-xs ${theme.textSecondary}`}>
            Computed longitudinally from your journal tags, reflection sentiments, and inquiry modes.
          </p>
        </div>

        {/* Overview Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-3 py-1.5 rounded-2xl bg-white/90 border ${theme.cardBorder} flex items-center gap-2 shadow-2xs`}>
            <Heart className={`w-3.5 h-3.5 ${theme.accentIconColor}`} />
            <div className="text-left">
              <span className={`text-[10px] ${theme.textMuted} block leading-tight`}>30-Day Avg State</span>
              <span className={`text-xs font-bold ${theme.textPrimary} font-mono`}>
                {stats.avgScore}/100
              </span>
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-2xl bg-white/90 border ${theme.cardBorder} flex items-center gap-2 shadow-2xs`}>
            <TrendingUp
              className={`w-3.5 h-3.5 ${
                stats.trendPercentage >= 0 ? theme.accentIconColor : 'text-amber-500'
              }`}
            />
            <div className="text-left">
              <span className={`text-[10px] ${theme.textMuted} block leading-tight`}>Monthly Trajectory</span>
              <span
                className={`text-xs font-bold font-mono ${
                  stats.trendPercentage >= 0 ? theme.textPrimary : 'text-amber-600'
                }`}
              >
                {stats.trendPercentage >= 0 ? `+${stats.trendPercentage}%` : `${stats.trendPercentage}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension Filter Tabs */}
      <div className={`flex items-center justify-between gap-3 flex-wrap relative z-10 border-b ${theme.cardBorder} pb-3`}>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className={`text-xs ${theme.textSecondary} font-medium mr-1 flex items-center gap-1`}>
            <Sparkles className={`w-3 h-3 ${theme.accentIconColor}`} />
            <span>Dimensions:</span>
          </span>

          {[
            { id: 'all', label: 'All Dimensions', color: theme.chartMainStroke },
            { id: 'harmony', label: 'Calm & Harmony', color: theme.chartSecondaryStroke },
            { id: 'vitality', label: 'Vitality & Energy', color: theme.chartMutedStroke },
            { id: 'clarity', label: 'Clarity & Focus', color: theme.chartAccentStroke },
            { id: 'stress', label: 'Stress Sensitivity', color: '#BE123C' },
          ].map((dim) => (
            <button
              key={dim.id}
              type="button"
              onClick={() => setSelectedDimension(dim.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedDimension === dim.id
                  ? `${theme.pillActive}`
                  : `${theme.pillInactive}`
              }`}
            >
              <span
                className="w-2 h-2 rounded-full inline-block mr-1.5"
                style={{ backgroundColor: dim.color }}
              />
              {dim.label}
            </button>
          ))}
        </div>

        {/* Most Frequent Tags */}
        {stats.topTags.length > 0 && (
          <div className={`flex items-center gap-1.5 text-xs ${theme.textSecondary}`}>
            <Tag className={`w-3 h-3 ${theme.textMuted}`} />
            <span className="text-[11px]">Dominant tags:</span>
            <div className="flex items-center gap-1">
              {stats.topTags.map((t) => (
                <span
                  key={t.name}
                  className={`px-2 py-0.5 rounded-md ${theme.pillInactive} text-[10px] shadow-2xs`}
                >
                  #{t.name} ({t.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Recharts Line Chart */}
      <div
        id="recharts-emotional-progression-wrapper"
        className="w-full h-72 md:h-80 relative z-10 pt-2 select-none"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.chartGridStroke}
              vertical={false}
              opacity={0.8}
            />

            <XAxis
              dataKey="displayDate"
              stroke={theme.chartAxisStroke}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: theme.chartGridStroke }}
              interval="preserveStartEnd"
              minTickGap={25}
            />

            <YAxis
              domain={[0, 100]}
              stroke={theme.chartAxisStroke}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: theme.chartGridStroke }}
              ticks={[20, 40, 60, 80, 100]}
            />

            <Tooltip content={renderCustomTooltip} />

            {/* Baseline Center Reference Line */}
            <ReferenceLine
              y={70}
              stroke={theme.chartMutedStroke}
              strokeDasharray="4 4"
              label={{
                value: 'Optimal Centered State (70)',
                fill: theme.chartAxisStroke,
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            {/* Overall Composite Emotional State Line */}
            {(selectedDimension === 'all' || selectedDimension === 'harmony') && (
              <Line
                type="monotone"
                dataKey="overall"
                name="Overall Emotional State"
                stroke={theme.chartMainStroke}
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.hasEntries) {
                    return (
                      <circle
                        key={`dot-${payload.date}`}
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill={theme.chartMainStroke}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle key={`dot-empty-${payload.date}`} cx={cx} cy={cy} r={0} />;
                }}
                activeDot={{ r: 6, fill: theme.chartMainStroke, stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}

            {/* Calm & Harmony Line */}
            {(selectedDimension === 'all' || selectedDimension === 'harmony') && (
              <Line
                type="monotone"
                dataKey="harmony"
                name="Calm & Harmony"
                stroke={theme.chartSecondaryStroke}
                strokeWidth={selectedDimension === 'harmony' ? 2.5 : 1.5}
                strokeDasharray={selectedDimension === 'all' ? '4 4' : undefined}
                dot={false}
                opacity={selectedDimension === 'all' ? 0.75 : 1}
              />
            )}

            {/* Vitality & Energy Line */}
            {(selectedDimension === 'all' || selectedDimension === 'vitality') && (
              <Line
                type="monotone"
                dataKey="vitality"
                name="Vitality & Energy"
                stroke={theme.chartMutedStroke}
                strokeWidth={selectedDimension === 'vitality' ? 2.5 : 1.5}
                strokeDasharray={selectedDimension === 'all' ? '3 3' : undefined}
                dot={false}
                opacity={selectedDimension === 'all' ? 0.75 : 1}
              />
            )}

            {/* Clarity & Focus Line */}
            {(selectedDimension === 'all' || selectedDimension === 'clarity') && (
              <Line
                type="monotone"
                dataKey="clarity"
                name="Clarity & Focus"
                stroke={theme.chartAccentStroke}
                strokeWidth={selectedDimension === 'clarity' ? 2.5 : 1.5}
                strokeDasharray={selectedDimension === 'all' ? '5 3' : undefined}
                dot={false}
                opacity={selectedDimension === 'all' ? 0.75 : 1}
              />
            )}

            {/* Stress Sensitivity Line */}
            {selectedDimension === 'stress' && (
              <Line
                type="monotone"
                dataKey="stress"
                name="Stress Sensitivity"
                stroke="#BE123C"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.hasEntries) {
                    return (
                      <circle
                        key={`dot-stress-${payload.date}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#BE123C"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle key={`dot-stress-empty-${payload.date}`} cx={cx} cy={cy} r={0} />;
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend & Context Footer */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${theme.textSecondary} pt-2 border-t ${theme.cardBorder} relative z-10`}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: theme.chartMainStroke }} />
            <span className={`${theme.textPrimary} font-medium`}>Composite Emotional State</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block border-t border-dashed" style={{ backgroundColor: theme.chartSecondaryStroke }} />
            <span>Harmony</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block border-t border-dashed" style={{ backgroundColor: theme.chartMutedStroke }} />
            <span>Vitality</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block border-t border-dashed" style={{ backgroundColor: theme.chartAccentStroke }} />
            <span>Clarity</span>
          </div>
        </div>

        <div className={`text-[11px] ${theme.textMuted} font-mono`}>
          Filled dots indicate recorded journal reflections
        </div>
      </div>
    </div>
  );
};
