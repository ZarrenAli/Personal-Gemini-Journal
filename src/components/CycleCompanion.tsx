import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  Calendar,
  Activity,
  Droplets,
  Smile,
  Shield,
  Clock,
  ChevronRight,
  Info,
  Loader2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Feather
} from 'lucide-react';
import { CycleLogEntry, CycleSettings, CyclePhase, FlowIntensity } from '../types';
import { calculateCycleStatus, PhaseInfo } from '../lib/cycleMath';
import { getAllCycleLogs, saveCycleLog, deleteCycleLog } from '../lib/cycleStorage';
import { requestCycleCoach } from '../lib/geminiApi';
import { MonumentRealmTheme, getRealmTheme } from '../lib/realmTheme';

interface CycleCompanionProps {
  userId: string;
  cycleSettings: CycleSettings;
  onOpenSettings: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  monumentTheme?: MonumentRealmTheme;
}

const SYMPTOM_OPTIONS = [
  { id: 'cramps', label: 'Cramps', category: 'physical' },
  { id: 'fatigue', label: 'Fatigue', category: 'physical' },
  { id: 'headaches', label: 'Headaches', category: 'physical' },
  { id: 'bloating', label: 'Bloating', category: 'physical' },
  { id: 'tender_breasts', label: 'Tender Breasts', category: 'physical' },
  { id: 'backache', label: 'Backache', category: 'physical' },
  { id: 'restless_sleep', label: 'Restless Sleep', category: 'physical' },
  { id: 'cravings', label: 'Sweet Cravings', category: 'physical' },
];

const MOOD_OPTIONS = [
  { id: 'calm', label: 'Calm & Centered', color: '#A3B18A' },
  { id: 'sensitive', label: 'Tender & Sensitive', color: '#B0A8B9' },
  { id: 'reflective', label: 'Inward & Reflective', color: '#E6C7C2' },
  { id: 'energetic', label: 'Bright & Energetic', color: '#F2CC8F' },
  { id: 'anxious', label: 'Anxious / Restless', color: '#E07A5F' },
  { id: 'focused', label: 'Deeply Focused', color: '#588157' },
  { id: 'vulnerable', label: 'Emotionally Vulnerable', color: '#D9777F' },
  { id: 'irritable', label: 'Overwhelmed / Irritable', color: '#7E6B8F' },
];

const FLOW_OPTIONS: { id: FlowIntensity; label: string; drops: number }[] = [
  { id: 'none', label: 'None', drops: 0 },
  { id: 'spotting', label: 'Spotting', drops: 1 },
  { id: 'light', label: 'Light', drops: 2 },
  { id: 'medium', label: 'Medium', drops: 3 },
  { id: 'heavy', label: 'Heavy', drops: 4 },
];

export const CycleCompanion: React.FC<CycleCompanionProps> = ({
  userId,
  cycleSettings,
  onOpenSettings,
  onShowToast,
  monumentTheme = 'rose',
}) => {
  const theme = getRealmTheme(monumentTheme);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentPhaseInfo, setCurrentPhaseInfo] = useState<PhaseInfo>(() =>
    calculateCycleStatus(cycleSettings, selectedDate)
  );

  // Active form state
  const [flow, setFlow] = useState<FlowIntensity>('none');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [coachAdvice, setCoachAdvice] = useState<string | null>(null);
  const [isConsultingCoach, setIsConsultingCoach] = useState(false);
  const [logs, setLogs] = useState<CycleLogEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Recalculate phase when date or settings change
  useEffect(() => {
    const status = calculateCycleStatus(cycleSettings, selectedDate);
    setCurrentPhaseInfo(status);
  }, [cycleSettings, selectedDate]);

  // Load logs on mount
  useEffect(() => {
    loadLogs();
  }, [userId]);

  const loadLogs = async () => {
    try {
      const all = await getAllCycleLogs(userId);
      setLogs(all);

      // Prefill if log exists for selected date
      const existing = all.find((e) => e.date === selectedDate);
      if (existing) {
        setFlow(existing.flow);
        setSymptoms(existing.symptoms || []);
        setMoods(existing.moods || []);
        setNotes(existing.notes || '');
        setCoachAdvice(existing.geminiAdvice || null);
      } else {
        // Defaults
        setFlow(currentPhaseInfo.phase === 'menstrual' ? 'medium' : 'none');
        setSymptoms([]);
        setMoods([]);
        setNotes('');
        setCoachAdvice(null);
      }
    } catch (err) {
      console.warn('Failed to load local cycle logs:', err);
    }
  };

  // Date change handler
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const existing = logs.find((e) => e.date === newDate);
    const newPhase = calculateCycleStatus(cycleSettings, newDate);
    setCurrentPhaseInfo(newPhase);

    if (existing) {
      setFlow(existing.flow);
      setSymptoms(existing.symptoms || []);
      setMoods(existing.moods || []);
      setNotes(existing.notes || '');
      setCoachAdvice(existing.geminiAdvice || null);
    } else {
      setFlow(newPhase.phase === 'menstrual' ? 'medium' : 'none');
      setSymptoms([]);
      setMoods([]);
      setNotes('');
      setCoachAdvice(null);
    }
  };

  // Toggle symptom pill
  const toggleSymptom = (id: string) => {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Toggle mood pill
  const toggleMood = (id: string) => {
    setMoods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // Save current log locally
  const handleSaveLog = async () => {
    try {
      setIsSaving(true);
      const newEntry: CycleLogEntry = {
        id: `cycle_${selectedDate}`,
        date: selectedDate,
        cycleDay: currentPhaseInfo.cycleDay,
        phase: currentPhaseInfo.phase,
        flow,
        symptoms,
        moods,
        notes,
        geminiAdvice: coachAdvice || undefined,
        timestamp: new Date().toISOString(),
      };

      await saveCycleLog(userId, newEntry);
      await loadLogs();
      onShowToast('Cycle wellness log saved to local storage.', 'success');
    } catch (err) {
      console.error('Failed to save cycle log:', err);
      onShowToast('Could not save local cycle record.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Request Gemini Cycle Coach
  const handleConsultCoach = async () => {
    try {
      setIsConsultingCoach(true);
      const res = await requestCycleCoach({
        phase: currentPhaseInfo.phase,
        cycleDay: currentPhaseInfo.cycleDay,
        flow,
        symptoms,
        moods,
        notes,
      });

      setCoachAdvice(res.advice);

      // Auto-save advice to local record
      const updatedEntry: CycleLogEntry = {
        id: `cycle_${selectedDate}`,
        date: selectedDate,
        cycleDay: currentPhaseInfo.cycleDay,
        phase: currentPhaseInfo.phase,
        flow,
        symptoms,
        moods,
        notes,
        geminiAdvice: res.advice,
        timestamp: new Date().toISOString(),
      };
      await saveCycleLog(userId, updatedEntry);
      await loadLogs();
      onShowToast('Gemini Cycle Coach guidance generated & saved.', 'success');
    } catch (err: any) {
      console.error('Failed to consult Gemini cycle coach:', err);
      onShowToast(err?.message || 'Failed to reach Gemini Cycle Coach.', 'error');
    } finally {
      setIsConsultingCoach(false);
    }
  };

  // Delete log
  const handleDeleteLog = async (dateToDelete: string) => {
    try {
      await deleteCycleLog(userId, dateToDelete);
      await loadLogs();
      if (dateToDelete === selectedDate) {
        setSymptoms([]);
        setMoods([]);
        setNotes('');
        setCoachAdvice(null);
      }
      onShowToast('Cycle log removed from local storage.', 'info');
    } catch (err) {
      console.error('Failed to delete cycle log:', err);
    }
  };

  return (
    <div
      id="cycle-companion-container"
      className={`flex-1 h-full overflow-y-auto bg-transparent ${theme.textPrimary} p-6 md:p-10 space-y-8 no-scrollbar relative z-10`}
    >
      {/* Top Header & Biophilic Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b ${theme.cardBorder}`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl ${theme.accentIconBg} border ${theme.accentIconBorder} flex items-center justify-center ${theme.accentIconColor} shadow-sm backdrop-blur-md`}>
            <Heart className="w-6 h-6 fill-current opacity-30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl md:text-2xl font-serif font-semibold ${theme.textPrimary}`}>
                Mindful Cycle Companion
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${theme.accentBadge}`}>
                Local & Private
              </span>
            </div>
            <p className={`text-xs ${theme.textSecondary} mt-0.5`}>
              Somatic hormonal rhythm tracking paired with gentle Gemini insights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 border ${theme.cardBorder} text-xs shadow-2xs`}>
            <Calendar className={`w-3.5 h-3.5 ${theme.accentIconColor}`} />
            <input
              id="cycle-date-selector"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`bg-transparent ${theme.textPrimary} focus:outline-hidden cursor-pointer font-sans`}
            />
          </div>

          <button
            id="open-cycle-settings-btn"
            type="button"
            onClick={onOpenSettings}
            className={`px-3.5 py-1.5 rounded-xl ${theme.secondaryBtn} text-xs font-medium transition-colors cursor-pointer shadow-2xs`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Phase Visualization Ring & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phase Card */}
        <div
          id="current-phase-card"
          className={`lg:col-span-2 rounded-3xl ${theme.cardBg} border ${theme.cardBorder} p-6 md:p-8 backdrop-blur-xl relative overflow-hidden space-y-6 shadow-sm`}
        >
          {/* Subtle Ambient Color Pill */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: currentPhaseInfo.themeColor }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase inline-flex items-center gap-1.5 mb-2.5 shadow-2xs"
                style={{
                  backgroundColor: `${currentPhaseInfo.themeColor}22`,
                  color: currentPhaseInfo.themeColor,
                  border: `1px solid ${currentPhaseInfo.themeColor}44`,
                }}
              >
                <Feather className="w-3 h-3" />
                {currentPhaseInfo.name}
              </span>

              <h2 className={`text-2xl md:text-3xl font-serif font-bold ${theme.textPrimary}`}>
                Cycle Day {currentPhaseInfo.cycleDay}{' '}
                <span className={`text-base font-normal ${theme.textSecondary} font-sans`}>
                  of ~{currentPhaseInfo.totalDays}
                </span>
              </h2>
            </div>

            <div className="text-right">
              <span className={`text-xs ${theme.textSecondary} block font-mono`}>
                {currentPhaseInfo.daysRemainingInPhase} days remaining in phase
              </span>
            </div>
          </div>

          {/* Biophilic 4-Phase Timeline Bar */}
          <div className="space-y-2 relative z-10">
            <div className={`h-3 w-full rounded-full ${theme.accentIconBg} overflow-hidden flex p-0.5 gap-1 border ${theme.cardBorder}`}>
              {/* Menstrual */}
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentPhaseInfo.phase === 'menstrual'
                    ? 'ring-2 ring-rose-500 shadow-xs'
                    : 'opacity-40'
                }`}
                style={{
                  width: `${(cycleSettings.averagePeriodLength / cycleSettings.averageCycleLength) * 100}%`,
                  backgroundColor: '#FB7185',
                }}
                title="Menstrual Phase"
              />
              {/* Follicular */}
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentPhaseInfo.phase === 'follicular'
                    ? 'ring-2 ring-rose-500 shadow-xs'
                    : 'opacity-40'
                }`}
                style={{
                  width: '30%',
                  backgroundColor: '#F43F5E',
                }}
                title="Follicular Phase"
              />
              {/* Ovulation */}
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentPhaseInfo.phase === 'ovulation'
                    ? 'ring-2 ring-rose-500 shadow-xs'
                    : 'opacity-40'
                }`}
                style={{
                  width: '15%',
                  backgroundColor: '#FDA4AF',
                }}
                title="Ovulatory Phase"
              />
              {/* Luteal */}
              <div
                className={`h-full rounded-full transition-all duration-500 flex-1 ${
                  currentPhaseInfo.phase === 'luteal'
                    ? 'ring-2 ring-rose-500 shadow-xs'
                    : 'opacity-40'
                }`}
                style={{
                  backgroundColor: '#E11D48',
                }}
                title="Luteal Phase"
              />
            </div>

            <div className={`flex justify-between text-[11px] font-sans px-1 ${theme.textSecondary} font-medium`}>
              <span>Menstrual</span>
              <span>Follicular</span>
              <span>Ovulation</span>
              <span>Luteal</span>
            </div>
          </div>

          <div className={`space-y-2 pt-2 border-t ${theme.cardBorder} relative z-10`}>
            <p className={`text-sm ${theme.textPrimary} font-serif leading-relaxed`}>
              {currentPhaseInfo.description}
            </p>
            <p className={`text-xs ${theme.textSecondary} leading-relaxed italic`}>
              {currentPhaseInfo.hormonalContext}
            </p>
          </div>
        </div>

        {/* Phase Recommendations Card */}
        <div className={`rounded-3xl ${theme.cardBg} border ${theme.cardBorder} p-6 backdrop-blur-xl flex flex-col justify-between space-y-4 shadow-sm`}>
          <div>
            <div className={`flex items-center gap-2 mb-3 text-xs font-semibold tracking-wider uppercase ${theme.textPrimary}`}>
              <Sparkles className={`w-3.5 h-3.5 ${theme.accentIconColor}`} />
              <span>Phase Care Focus</span>
            </div>
            <ul className="space-y-2.5">
              {currentPhaseInfo.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2.5 text-xs ${theme.textSecondary} leading-relaxed`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: currentPhaseInfo.themeColor }}
                  />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`p-3 rounded-2xl ${theme.accentIconBg} border ${theme.cardBorder} text-[11px] ${theme.textSecondary} flex items-center gap-2.5`}>
            <Shield className={`w-4 h-4 ${theme.accentIconColor} shrink-0`} />
            <span>Vaulted locally on this device. Fully private.</span>
          </div>
        </div>
      </div>

      {/* Daily Tracking Controls & Inputs */}
      <div className={`rounded-3xl ${theme.cardBg} border ${theme.cardBorder} p-6 md:p-8 backdrop-blur-xl space-y-7 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className={`w-4 h-4 ${theme.accentIconColor}`} />
            <h3 className={`text-base font-serif font-semibold ${theme.textPrimary}`}>
              Daily Somatic Markers & Flow
            </h3>
          </div>
          <span className={`text-xs ${theme.accentIconColor} font-mono`}>
            {new Date(selectedDate).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Flow Intensity Pills */}
        <div className="space-y-2.5">
          <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textPrimary} block`}>
            Flow Intensity
          </label>
          <div className="flex flex-wrap gap-2.5">
            {FLOW_OPTIONS.map((f) => {
              const active = flow === f.id;
              return (
                <button
                  key={f.id}
                  id={`flow-btn-${f.id}`}
                  type="button"
                  onClick={() => setFlow(f.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? `${theme.primaryBtn} shadow-xs font-semibold`
                      : `${theme.secondaryBtn}`
                  }`}
                >
                  <Droplets className={`w-3.5 h-3.5 ${active ? 'fill-white' : theme.textMuted}`} />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Physical Markers / Symptoms Pills */}
        <div className="space-y-2.5">
          <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textPrimary} block`}>
            Physical Symptoms & Sensations
          </label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map((sym) => {
              const active = symptoms.includes(sym.id);
              return (
                <button
                  key={sym.id}
                  id={`symptom-btn-${sym.id}`}
                  type="button"
                  onClick={() => toggleSymptom(sym.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                    active
                      ? `${theme.primaryBtn} shadow-xs font-semibold`
                      : `${theme.secondaryBtn}`
                  }`}
                >
                  {sym.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Emotional / Mood States */}
        <div className="space-y-2.5">
          <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textPrimary} block`}>
            Emotional & Hormonal Weather
          </label>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((mood) => {
              const active = moods.includes(mood.id);
              return (
                <button
                  key={mood.id}
                  id={`mood-btn-${mood.id}`}
                  type="button"
                  onClick={() => toggleMood(mood.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? `${theme.primaryBtn} shadow-xs font-semibold`
                      : `${theme.secondaryBtn}`
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: active ? '#ffffff' : mood.color }}
                  />
                  <span>{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Freeform Reflection Notes */}
        <div className="space-y-2">
          <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textPrimary} block`}>
            Sensitive Notes & Context
          </label>
          <textarea
            id="cycle-notes-textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Log specific physical sensations, energy levels, diet, or sleep notes for today..."
            className={`w-full p-3.5 rounded-2xl bg-white/90 border ${theme.cardBorder} ${theme.textPrimary} placeholder:${theme.textMuted} text-xs focus:outline-hidden transition-colors`}
          />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            id="save-cycle-log-btn"
            type="button"
            onClick={handleSaveLog}
            disabled={isSaving}
            className={`px-5 py-2.5 rounded-xl ${theme.secondaryBtn} text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs`}
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className={`w-3.5 h-3.5 ${theme.accentIconColor}`} />}
            <span>Save Local Log</span>
          </button>

          <button
            id="ask-cycle-coach-btn"
            type="button"
            onClick={handleConsultCoach}
            disabled={isConsultingCoach}
            className={`px-5 py-2.5 rounded-xl ${theme.primaryBtn} font-medium text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2`}
          >
            {isConsultingCoach ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Consulting Gemini Coach...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Ask Gemini Cycle Coach</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Gemini AI Cycle Coach Response */}
      {coachAdvice && (
        <div
          id="gemini-cycle-coach-response"
          className={`rounded-3xl ${theme.cardBg} border ${theme.cardBorder} p-6 md:p-8 backdrop-blur-2xl shadow-xl space-y-4 animate-fade-in relative overflow-hidden`}
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${theme.accentIconColor}`}>
              <Sparkles className="w-4 h-4" />
              <span>Gemini Empathetic Cycle Coach</span>
            </div>
            <span className={`text-[11px] ${theme.textMuted} font-mono`}>
              Phase-Aware Reflection
            </span>
          </div>

          <div className={`text-xs sm:text-sm ${theme.textPrimary} leading-relaxed font-serif whitespace-pre-line space-y-2`}>
            {coachAdvice}
          </div>
        </div>
      )}

      {/* Past Local Logs History */}
      <div className={`rounded-3xl ${theme.cardBg} border ${theme.cardBorder} p-6 backdrop-blur-xl space-y-4 shadow-sm`}>
        <h3 className={`text-sm font-serif font-semibold ${theme.textPrimary} flex items-center gap-2`}>
          <Clock className={`w-4 h-4 ${theme.accentIconColor}`} />
          <span>Recent Local Logs ({logs.length})</span>
        </h3>

        {logs.length === 0 ? (
          <p className={`text-xs ${theme.textMuted} py-3`}>
            No local cycle logs recorded yet. Use the controls above to log today's sensations.
          </p>
        ) : (
          <div className={`divide-y ${theme.cardBorder}`}>
            {logs.slice(0, 7).map((log) => (
              <div
                key={log.date}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${theme.textPrimary}`}>{log.date}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${theme.accentBadge} uppercase font-semibold`}>
                      Day {log.cycleDay} • {log.phase}
                    </span>
                    {log.flow !== 'none' && (
                      <span className={`${theme.accentIconColor} text-[11px] font-medium`}>
                        Flow: {log.flow}
                      </span>
                    )}
                  </div>
                  {log.symptoms?.length > 0 && (
                    <p className={`${theme.textSecondary} text-[11px]`}>
                      Sensations: {log.symptoms.join(', ')}
                    </p>
                  )}
                  {log.moods?.length > 0 && (
                    <p className={`${theme.textSecondary} text-[11px]`}>
                      Moods: {log.moods.join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleDateChange(log.date)}
                    className={`px-2.5 py-1 rounded-lg ${theme.secondaryBtn} text-[11px] transition-colors cursor-pointer shadow-2xs`}
                  >
                    View / Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLog(log.date)}
                    className={`p-1 ${theme.textMuted} hover:${theme.textPrimary} transition-colors cursor-pointer`}
                    title="Delete local record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
