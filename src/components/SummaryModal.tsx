import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, CheckCircle2, Lightbulb, FileText, Compass, HeartHandshake } from 'lucide-react';
import { JournalSummaryData } from '../types';
import { getMoodVisual } from '../lib/sentimentUtils';
import { MonumentRealmTheme, getRealmTheme } from '../lib/realmTheme';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summaryData: JournalSummaryData | null;
  onApplyTags?: (tags: string[]) => void;
  monumentTheme?: MonumentRealmTheme;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  title,
  summaryData,
  monumentTheme = 'rose',
}) => {
  if (!isOpen || !summaryData) return null;

  const theme = getRealmTheme(monumentTheme);
  const moodVisual = getMoodVisual(summaryData.sentiment, summaryData.moodCategory);
  const MoodIcon = moodVisual.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto p-2.5 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md flex flex-col justify-start sm:justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="my-auto mx-auto w-full max-w-2xl bg-[#0F172A]/95 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[88vh] text-slate-100 backdrop-blur-3xl"
        >
          {/* Modal Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl ${theme.accentIconBg} border ${theme.accentIconBorder} ${theme.accentIconColor} flex items-center justify-center shadow-xs shrink-0`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-serif font-semibold text-slate-100 truncate">
                  Gemini Sentiment & Reflection Synthesis
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">{title}</p>
              </div>
            </div>
            <button
              id="close-summary-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
            {/* Sentiment & Tone Badge with Color-Coded Mood Indicator */}
            {summaryData.sentiment && (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${moodVisual.iconBg} ${moodVisual.badgeBorder} ${moodVisual.iconColor}`}>
                    <MoodIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {summaryData.sentiment}
                      </span>
                      {summaryData.sentimentScore !== undefined && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-emerald-400 border border-emerald-500/30">
                          {summaryData.sentimentScore}% Grounded
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      {moodVisual.description}
                    </p>
                  </div>
                </div>

                {summaryData.modelUsed && (
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    analyzed with {summaryData.modelUsed}
                  </span>
                )}
              </div>
            )}

            {/* Sentiment Narrative Summary */}
            {summaryData.sentimentSummary && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md space-y-2">
                <div className={`flex items-center gap-2 ${theme.accentIconColor} font-serif font-bold`}>
                  <HeartHandshake className="w-4 h-4" />
                  <span>Emotional Weather & Sentiment Analysis</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans text-xs sm:text-sm">
                  {summaryData.sentimentSummary}
                </p>

                {/* Mood Keywords Chips */}
                {summaryData.sentimentKeywords && summaryData.sentimentKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {summaryData.sentimentKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Core Narrative Summary */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-md">
              <div className="flex items-center gap-2 text-slate-100 font-serif font-bold mb-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Executive Synthesis</span>
              </div>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line font-sans text-xs sm:text-sm">
                {summaryData.summary}
              </p>
            </div>

            {/* Key Insights */}
            {summaryData.keyTakeaways && summaryData.keyTakeaways.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-100 font-serif font-bold">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Key Insights & Patterns</span>
                </div>
                <div className="space-y-2">
                  {summaryData.keyTakeaways.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items / Somatic Next Steps */}
            {summaryData.actionItems && summaryData.actionItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-100 font-serif font-bold">
                  <Compass className={`w-4 h-4 ${theme.accentIconColor}`} />
                  <span>Gentle Inquiries & Next Steps</span>
                </div>
                <div className="space-y-2">
                  {summaryData.actionItems.map((action, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
