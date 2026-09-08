import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Loader2,
  Lightbulb,
  Brain,
  FileText,
  Heart,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  Calendar,
  Clock,
  BookOpen,
  ChevronDown,
  Mic,
  MicOff,
  Radio,
  HeartHandshake,
  Compass,
} from 'lucide-react';
import { JournalEntry, JournalMessage, ReflectionMode } from '../types';
import { requestReflection, requestSummary, requestSentimentAnalysis } from '../lib/geminiApi';
import { getMoodVisual } from '../lib/sentimentUtils';
import { monumentSound } from '../lib/monumentSound';
import { getRealmTheme, MonumentRealmTheme } from '../lib/realmTheme';

interface EntryEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => Promise<void>;
  onOpenSummaryModal: (entry: JournalEntry) => void;
  onOpenVoiceModal?: () => void;
  isSaving: boolean;
  saveError: string | null;
  onRetrySave: () => void;
  monumentTheme?: MonumentRealmTheme;
}

const REFLECTION_MODES: Array<{
  id: ReflectionMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: 'insight',
    label: 'Deep Insight',
    icon: Brain,
    description: 'Analytical inquiry, pattern identification & uncovering assumptions',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorming',
    icon: Lightbulb,
    description: 'Creative exploration, lateral options & innovative solutions',
  },
  {
    id: 'summary',
    label: 'Synthesis',
    icon: FileText,
    description: 'Extracting key themes, essence & structured summaries',
  },
  {
    id: 'compassion',
    label: 'Compassion',
    icon: Heart,
    description: 'Gentle warmth, nervous system calm & supportive emotional presence',
  },
];

export const EntryEditor: React.FC<EntryEditorProps> = ({
  entry,
  onUpdateEntry,
  onOpenSummaryModal,
  onOpenVoiceModal,
  isSaving,
  saveError,
  onRetrySave,
  monumentTheme = 'rose',
}) => {
  const theme = getRealmTheme(monumentTheme);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [reflectionMode, setReflectionMode] = useState<ReflectionMode>('insight');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [title, setTitle] = useState(entry.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDictating, setIsDictating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync title when entry prop changes
  useEffect(() => {
    setTitle(entry.title);
  }, [entry.id, entry.title]);

  // Speech-to-text dictation setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setCurrentPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser environment.');
      return;
    }

    if (isDictating) {
      recognitionRef.current.stop();
      setIsDictating(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsDictating(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isAiGenerating]);

  // Save Title edit
  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    const sanitizedTitle = title.trim() || 'Untitled Reflection';
    setTitle(sanitizedTitle);
    if (sanitizedTitle !== entry.title) {
      await onUpdateEntry({
        ...entry,
        title: sanitizedTitle,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Copy message helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Send reflection to Gemini
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = currentPrompt.trim();
    if (!promptText || isAiGenerating) return;

    monumentSound.playStoneClick(1.0);
    monumentSound.playNextMelodicChime(0.08);
    setAiError(null);
    const userMsgId = `user_${Date.now()}`;
    const userMsg: JournalMessage = {
      id: userMsgId,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toISOString(),
      reflectionMode,
    };

    // Optimistically update conversation state
    const updatedMessages = [...entry.messages, userMsg];
    const temporaryEntry: JournalEntry = {
      ...entry,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    setIsAiGenerating(true);
    const submittedPrompt = promptText;
    setCurrentPrompt('');

    try {
      // 1. Call Gemini Backend Route
      const geminiRes = await requestReflection({
        prompt: submittedPrompt,
        conversationHistory: entry.messages,
        reflectionMode,
        title: entry.title,
      });

      const geminiMsg: JournalMessage = {
        id: `gemini_${Date.now()}`,
        sender: 'gemini',
        text: geminiRes.reply,
        timestamp: geminiRes.timestamp || new Date().toISOString(),
        reflectionMode,
        modelUsed: geminiRes.modelUsed,
      };

      const finalMessages = [...updatedMessages, geminiMsg];
      const finalEntry: JournalEntry = {
        ...entry,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };

      // 2. Guaranteed Transaction Persistence to Firestore
      await onUpdateEntry(finalEntry);
      monumentSound.playHarmonicResolve();
    } catch (err: any) {
      console.error('Failed reflection transaction:', err);
      setCurrentPrompt(submittedPrompt);
      setAiError(err?.message || 'Failed to generate Gemini reflection. Please try again.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Summarize Entry with Gemini
  const handleGenerateSummary = async () => {
    if (entry.messages.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    setAiError(null);

    try {
      const summaryResult = await requestSummary({
        title: entry.title,
        messages: entry.messages,
      });

      const updatedEntry: JournalEntry = {
        ...entry,
        summary: summaryResult.summary,
        keyTakeaways: summaryResult.keyTakeaways,
        sentiment: summaryResult.sentiment,
        sentimentSummary: summaryResult.sentimentSummary,
        sentimentScore: summaryResult.sentimentScore,
        sentimentKeywords: summaryResult.sentimentKeywords,
        moodCategory: summaryResult.moodCategory,
        actionItems: summaryResult.actionItems,
        updatedAt: new Date().toISOString(),
      };

      await onUpdateEntry(updatedEntry);
      onOpenSummaryModal(updatedEntry);
    } catch (err: any) {
      console.error('Summarization failed:', err);
      setAiError(err?.message || 'Failed to synthesize summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Dedicated Sentiment Analysis for Individual Entry
  const handleAnalyzeSentiment = async () => {
    if (entry.messages.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    setAiError(null);

    try {
      const result = await requestSentimentAnalysis({
        title: entry.title,
        messages: entry.messages,
      });

      const updatedEntry: JournalEntry = {
        ...entry,
        sentiment: result.sentiment,
        sentimentSummary: result.sentimentSummary,
        sentimentScore: result.sentimentScore,
        sentimentKeywords: result.sentimentKeywords,
        moodCategory: result.moodCategory,
        summary: result.summary || entry.summary,
        keyTakeaways: result.keyTakeaways || entry.keyTakeaways,
        actionItems: result.actionItems || entry.actionItems,
        updatedAt: new Date().toISOString(),
      };

      await onUpdateEntry(updatedEntry);
    } catch (err: any) {
      console.error('Sentiment analysis failed:', err);
      setAiError(err?.message || 'Failed to analyze sentiment.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle Ctrl/Cmd + Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeModeDetails = REFLECTION_MODES.find((m) => m.id === reflectionMode);

  return (
    <div className={`flex-1 flex flex-col h-full bg-white/40 backdrop-blur-2xl ${theme.textPrimary} overflow-hidden transition-colors duration-300`}>
      {/* Top Meta Bar */}
      <div className={`px-6 py-4 border-b ${theme.cardBorder} bg-white/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-xs`}>
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              id="entry-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleBlur();
              }}
              autoFocus
              className={`text-lg sm:text-2xl font-serif font-bold ${theme.textPrimary} bg-white border ${theme.cardActiveBorder} rounded-xl px-3 py-1 w-full max-w-lg ${theme.inputFocus} shadow-xs`}
            />
          ) : (
            <div
              id="entry-title-display"
              onClick={() => setIsEditingTitle(true)}
              className={`text-lg sm:text-2xl font-serif font-bold ${theme.textPrimary} cursor-pointer hover:opacity-80 transition-colors flex items-center gap-2 group truncate`}
              title="Click to rename entry"
            >
              <span className="truncate">{title}</span>
              <span className={`text-xs font-sans ${theme.textMuted} opacity-0 group-hover:opacity-100 transition-opacity`}>
                (rename)
              </span>
            </div>
          )}

          <div className={`flex items-center gap-3 mt-1 text-xs ${theme.textSecondary}`}>
            <span className="flex items-center gap-1 font-mono">
              <Calendar className={`w-3.5 h-3.5 ${theme.textAccent}`} />
              {new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className={`w-3.5 h-3.5 ${theme.textAccent}`} />
              {entry.messages.length} exchanges
            </span>
            {entry.sentiment ? (
              <>
                <span>&bull;</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${getMoodVisual(entry.sentiment, entry.moodCategory).badgeBg} ${getMoodVisual(entry.sentiment, entry.moodCategory).badgeText} ${getMoodVisual(entry.sentiment, entry.moodCategory).badgeBorder}`}
                  title={entry.sentimentSummary || `Detected Mood: ${entry.sentiment}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${getMoodVisual(entry.sentiment, entry.moodCategory).dotColor}`} />
                  <span>{entry.sentiment}</span>
                  {entry.sentimentScore !== undefined && (
                    <span className="text-[10px] opacity-75 font-mono">({entry.sentimentScore}%)</span>
                  )}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {entry.summary || entry.sentiment ? (
            <div className="flex items-center gap-1.5">
              <button
                id="view-summary-btn"
                type="button"
                onClick={() => onOpenSummaryModal(entry)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ${theme.accentBadge} text-xs font-medium transition-all cursor-pointer shadow-2xs`}
                title="View Gemini Sentiment and Reflection Synthesis"
              >
                <FileText className={`w-3.5 h-3.5 ${theme.textAccent}`} />
                <span>AI Sentiment & Summary</span>
              </button>

              <button
                id="reanalyze-sentiment-btn"
                type="button"
                onClick={handleAnalyzeSentiment}
                disabled={isSummarizing || entry.messages.length === 0}
                className={`p-1.5 rounded-xl ${theme.secondaryBtn} transition-all cursor-pointer shadow-2xs disabled:opacity-50`}
                title="Re-analyze Sentiment with Gemini"
              >
                {isSummarizing ? (
                  <Loader2 className={`w-3.5 h-3.5 animate-spin ${theme.textAccent}`} />
                ) : (
                  <RotateCw className={`w-3.5 h-3.5 ${theme.textAccent}`} />
                )}
              </button>
            </div>
          ) : (
            <button
              id="generate-summary-btn"
              type="button"
              onClick={handleAnalyzeSentiment}
              disabled={entry.messages.length === 0 || isSummarizing}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ${theme.secondaryBtn} text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs`}
              title={
                entry.messages.length === 0
                  ? 'Add at least 1 thought to analyze sentiment'
                  : 'Synthesize sentiment and insights with Gemini'
              }
            >
              {isSummarizing ? (
                <Loader2 className={`w-3.5 h-3.5 animate-spin ${theme.textAccent}`} />
              ) : (
                <Sparkles className={`w-3.5 h-3.5 ${theme.textAccent}`} />
              )}
              <span>{isSummarizing ? 'Analyzing...' : 'Analyze Sentiment'}</span>
            </button>
          )}

          {/* Cloud Save Indicator */}
          <div className={`text-xs ${theme.textSecondary} flex items-center gap-1.5 pl-2 border-l ${theme.cardBorder}`}>
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Saved</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Write Error Banner */}
      {saveError && (
        <div
          id="firestore-save-error-banner"
          className="bg-rose-100 border-b border-rose-300 px-6 py-2.5 flex items-center justify-between text-xs text-rose-900 shrink-0 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Firestore Save Notice:</strong> {saveError}
            </span>
          </div>
          <button
            id="retry-save-btn"
            type="button"
            onClick={onRetrySave}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors cursor-pointer shadow-xs"
          >
            <RotateCw className="w-3 h-3" />
            <span>Retry Save</span>
          </button>
        </div>
      )}

      {/* AI Error Alert */}
      {aiError && (
        <div
          id="gemini-error-banner"
          className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between text-xs text-rose-800 shrink-0 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{aiError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiError(null)}
            className="text-rose-500 hover:text-rose-900 font-bold px-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        {entry.messages.length === 0 ? (
          <div className={`h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12 ${theme.textSecondary}`}>
            <div className={`w-16 h-16 rounded-3xl ${theme.accentIconBg} border ${theme.accentIconBorder} ${theme.accentIconColor} flex items-center justify-center mb-4 shadow-xs backdrop-blur-md`}>
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className={`text-2xl font-serif font-bold ${theme.textPrimary} mb-2 tracking-tight`}>
              Begin your reflection
            </h3>
            <p className={`text-xs sm:text-sm ${theme.textSecondary} leading-relaxed mb-6 font-sans`}>
              Speak or write your thoughts in this {theme.name} sanctuary. Choose an inquiry lens below, or speak freely with Gemini.
            </p>

            {onOpenVoiceModal && (
              <button
                id="empty-state-voice-btn"
                type="button"
                onClick={onOpenVoiceModal}
                className={`w-full mb-6 p-4 rounded-2xl ${theme.primaryBtn} flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-98 font-medium`}
              >
                <Mic className="w-5 h-5 animate-pulse text-white" />
                <span className="text-xs sm:text-sm">Talk to Gemini (Hands-Free Voice Journal)</span>
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left w-full">
              {REFLECTION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setReflectionMode(mode.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-xl ${
                    reflectionMode === mode.id
                      ? `${theme.cardActiveBorder} ${theme.pillActive}`
                      : `${theme.cardBorder} ${theme.cardBg} ${theme.cardBorderHover} ${theme.textSecondary} shadow-xs`
                  }`}
                >
                  <div className={`flex items-center gap-2 text-xs font-semibold ${theme.textPrimary} mb-1`}>
                    <mode.icon className={`w-4 h-4 ${theme.textAccent}`} />
                    <span>{mode.label}</span>
                  </div>
                  <div className={`text-[11px] ${theme.textMuted} leading-relaxed`}>
                    {mode.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Sentiment Analysis Summary Card */}
            {entry.sentiment ? (
              <div
                id="entry-sentiment-summary-card"
                className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-xs backdrop-blur-xl ${getMoodVisual(entry.sentiment, entry.moodCategory).cardBg} ${getMoodVisual(entry.sentiment, entry.moodCategory).cardBorder} mb-4`}
              >
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${theme.cardBorder}`}>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const mv = getMoodVisual(entry.sentiment, entry.moodCategory);
                      const Icon = mv.icon;
                      return (
                        <div
                          className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-xs shrink-0 ${mv.iconBg} ${mv.badgeBorder} ${mv.iconColor}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                      );
                    })()}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] font-mono uppercase tracking-wider ${theme.textAccent} font-semibold`}>
                          Emotional Weather
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-serif font-bold border ${getMoodVisual(entry.sentiment, entry.moodCategory).badgeBg} ${getMoodVisual(entry.sentiment, entry.moodCategory).badgeText} ${getMoodVisual(entry.sentiment, entry.moodCategory).badgeBorder}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${getMoodVisual(entry.sentiment, entry.moodCategory).dotColor}`} />
                          {entry.sentiment}
                        </span>
                        {entry.sentimentScore !== undefined && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/80 ${theme.textPrimary} border ${theme.cardBorder} shadow-2xs font-semibold`}>
                            {entry.sentimentScore}% Grounded
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] ${theme.textSecondary} font-sans mt-0.5`}>
                        {getMoodVisual(entry.sentiment, entry.moodCategory).description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      id="sentiment-card-view-summary-btn"
                      type="button"
                      onClick={() => onOpenSummaryModal(entry)}
                      className={`px-3 py-1.5 rounded-xl ${theme.secondaryBtn} text-xs font-medium shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5`}
                    >
                      <FileText className={`w-3.5 h-3.5 ${theme.textAccent}`} />
                      <span>Full Synthesis</span>
                    </button>

                    <button
                      id="sentiment-card-reanalyze-btn"
                      type="button"
                      onClick={handleAnalyzeSentiment}
                      disabled={isSummarizing}
                      className={`p-1.5 rounded-xl ${theme.secondaryBtn} shadow-2xs transition-all cursor-pointer disabled:opacity-50`}
                      title="Re-analyze Sentiment"
                    >
                      {isSummarizing ? (
                        <Loader2 className={`w-3.5 h-3.5 animate-spin ${theme.textAccent}`} />
                      ) : (
                        <RotateCw className={`w-3.5 h-3.5 ${theme.textAccent}`} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sentiment Breakdown Narrative */}
                <div className={`pt-3 space-y-2 text-xs sm:text-sm ${theme.textPrimary} font-sans leading-relaxed`}>
                  <p className={`whitespace-pre-line ${theme.textSecondary} font-sans`}>
                    {entry.sentimentSummary || entry.summary || 'Sentiment analysis synthesized for this reflection.'}
                  </p>

                  {/* Emotion Keywords */}
                  {entry.sentimentKeywords && entry.sentimentKeywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {entry.sentimentKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium ${theme.accentBadge} shadow-2xs`}
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                id="entry-sentiment-prompt-card"
                className={`p-4 rounded-3xl ${theme.cardBg} border ${theme.cardBorder} mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs backdrop-blur-md`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl ${theme.accentIconBg} ${theme.accentIconColor} border ${theme.accentIconBorder} flex items-center justify-center shrink-0`}>
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-semibold ${theme.textPrimary} font-serif`}>
                      Emotional Weather & Sentiment Analysis
                    </h4>
                    <p className={`text-[11px] ${theme.textMuted} font-sans`}>
                      Analyze the emotional tone, mood patterns, and groundedness in this entry using Gemini.
                    </p>
                  </div>
                </div>

                <button
                  id="prompt-analyze-sentiment-btn"
                  type="button"
                  onClick={handleAnalyzeSentiment}
                  disabled={isSummarizing}
                  className={`px-3.5 py-1.5 rounded-xl ${theme.primaryBtn} text-xs font-medium transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50`}
                >
                  {isSummarizing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>{isSummarizing ? 'Analyzing...' : 'Analyze Sentiment'}</span>
                </button>
              </div>
            )}

            {entry.messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Pill & Time */}
                  <div className={`flex items-center gap-2 mb-1.5 px-2 text-[11px] ${theme.textSecondary}`}>
                    <span className={`font-semibold ${theme.textPrimary}`}>
                      {isUser ? 'You' : 'Gemini'}
                    </span>
                    {msg.reflectionMode && (
                      <span className={`capitalize text-[10px] px-2 py-0.5 rounded-full ${theme.accentBadge} font-medium`}>
                        {msg.reflectionMode}
                      </span>
                    )}
                    <span className="font-mono opacity-60">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-2xl sm:max-w-3xl rounded-3xl p-5 sm:p-6 text-sm sm:text-base leading-relaxed group backdrop-blur-xl ${
                      isUser
                        ? `${theme.userBubble} rounded-tr-xs shadow-md`
                        : `${theme.geminiBubble} rounded-tl-xs shadow-md`
                    }`}
                  >
                    {isUser ? (
                      <div className={`whitespace-pre-wrap font-sans ${theme.textPrimary}`}>{msg.text}</div>
                    ) : (
                      <div className={`markdown-body ${theme.textPrimary} text-sm sm:text-base space-y-3 font-serif leading-relaxed`}>
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    )}

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.text, msg.id)}
                      title="Copy message"
                      className={`absolute top-3 right-3 p-1.5 rounded-lg transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer text-stone-400 ${theme.iconBtnHover}`}
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
        </>
      )}

        {/* AI Typing Indicator */}
        {isAiGenerating && (
          <div className="flex flex-col items-start">
            <div className={`flex items-center gap-2 mb-1.5 px-2 text-[11px] ${theme.textSecondary}`}>
              <span className={`font-semibold ${theme.textPrimary}`}>Gemini</span>
              <span>Thinking & reflecting...</span>
            </div>
            <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} shadow-xs flex items-center gap-3 ${theme.textPrimary} text-sm backdrop-blur-md`}>
              <Sparkles className={`w-4 h-4 ${theme.textAccent} animate-spin`} />
              <span className={`animate-pulse font-serif italic ${theme.textSecondary}`}>Composing thoughtful reflection...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Tray */}
      <div className={`p-4 sm:p-6 border-t ${theme.cardBorder} bg-white/70 backdrop-blur-2xl shrink-0`}>
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Mode Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className={`${theme.textAccent} font-medium whitespace-nowrap pl-1 font-mono text-[10px] uppercase tracking-wider`}>
              Lens:
            </span>
            {REFLECTION_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setReflectionMode(mode.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  reflectionMode === mode.id
                    ? `${theme.primaryBtn} font-medium shadow-xs`
                    : `${theme.secondaryBtn}`
                }`}
              >
                <mode.icon className="w-3 h-3" />
                <span>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="relative flex flex-col">
            <textarea
              id="reflection-prompt-textarea"
              ref={textareaRef}
              rows={3}
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAiGenerating}
              placeholder={`Write your reflection in ${activeModeDetails?.label} mode... (Press Ctrl+Enter to send)`}
              className={`w-full resize-none p-4 pr-24 rounded-2xl border ${theme.inputBorder} text-sm sm:text-base ${theme.textPrimary} ${theme.inputBg} ${theme.inputFocus} placeholder:text-stone-400 transition-all font-sans shadow-xs`}
            />

            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button
                id="dictate-reflection-btn"
                type="button"
                onClick={toggleDictation}
                disabled={isAiGenerating}
                className={`p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isDictating
                    ? `${theme.primaryBtn} animate-pulse`
                    : `${theme.secondaryBtn}`
                }`}
                title={isDictating ? 'Stop dictation' : 'Dictate reflection by voice'}
              >
                {isDictating ? <MicOff className="w-4 h-4 text-white" /> : <Mic className={`w-4 h-4 ${theme.textAccent}`} />}
              </button>

              <button
                id="send-reflection-btn"
                type="submit"
                disabled={!currentPrompt.trim() || isAiGenerating}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${theme.primaryBtn} active:scale-95 text-xs sm:text-sm font-medium transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
              >
                {isAiGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
                <span>Send</span>
              </button>
            </div>
          </form>

          <div className={`flex items-center justify-between text-[11px] ${theme.textMuted} px-1`}>
            <span>
              {activeModeDetails?.description}
            </span>
            <span className="hidden sm:inline font-mono opacity-60">Ctrl + Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
