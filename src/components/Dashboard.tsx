import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizePayload } from '../lib/sanitizer';
import {
  AuthUserProfile,
  JournalEntry,
  JournalSummaryData,
  CycleSettings,
  UserPreferences,
} from '../types';
import { MinimalSidebar } from './MinimalSidebar';
import { EntryHistory } from './EntryHistory';
import { EntryEditor } from './EntryEditor';
import { CycleCompanion } from './CycleCompanion';
import { WellbeingDashboard } from './WellbeingDashboard';
import { CycleOnboardingModal } from './CycleOnboardingModal';
import { SettingsModal } from './SettingsModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { ToastNotification, ToastMessage } from './ToastNotification';
import { SummaryModal } from './SummaryModal';
import { VoiceJournalModal } from './VoiceJournalModal';
import { MonumentValleyCanvas } from './MonumentValleyCanvas';
import { RealmAtmosphereCanvas } from './RealmAtmosphereCanvas';
import { MonumentChimeToggle } from './MonumentChimeToggle';
import { requestSummary } from '../lib/geminiApi';
import {
  getUserPreferences,
  saveUserPreferences,
  getCycleSettings,
  saveCycleSettings,
} from '../lib/cycleStorage';
import { monumentSound } from '../lib/monumentSound';
import { getRealmTheme } from '../lib/realmTheme';
import { Loader2, Sparkles, Feather, Heart, Mic, Activity, Compass } from 'lucide-react';

interface DashboardProps {
  user: AuthUserProfile;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  // Navigation & Workspace State
  const [activeTab, setActiveTab] = useState<'journal' | 'cycle' | 'wellbeing'>('journal');
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Monument Realm Theme Atmosphere
  const [monumentTheme, setMonumentTheme] = useState<'rose' | 'twilight' | 'sand' | 'teal'>(() => {
    const saved = localStorage.getItem('monument_realm_theme');
    if (saved === 'rose' || saved === 'twilight' || saved === 'sand' || saved === 'teal') {
      return saved;
    }
    return 'sand';
  });
  
  const [isMuted, setIsMuted] = useState(monumentSound.getMuted());

  // Synchronize dynamic realm theme on document root and update audio track
  useEffect(() => {
    document.documentElement.setAttribute('data-realm', monumentTheme);
    document.body.setAttribute('data-realm', monumentTheme);
    if (monumentTheme === 'twilight') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    monumentSound.setRealm(monumentTheme);
  }, [monumentTheme]);

  // Cycle realm atmosphere helper (Monument Valley palette homage)
  const cycleTheme = () => {
    const themes: ('rose' | 'twilight' | 'sand' | 'teal')[] = ['rose', 'sand', 'teal', 'twilight'];
    const next = themes[(themes.indexOf(monumentTheme) + 1) % themes.length];
    setMonumentTheme(next);
    localStorage.setItem('monument_realm_theme', next);
  };

  const handleSelectTheme = (theme: 'rose' | 'twilight' | 'sand' | 'teal') => {
    setMonumentTheme(theme);
    localStorage.setItem('monument_realm_theme', theme);
  };

  // Journal Entries State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastPendingEntry, setLastPendingEntry] = useState<JournalEntry | null>(null);

  // Deletion Confirmation Modal State (Task 1)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Mindful Cycle Companion Preferences & Onboarding State (Task 3)
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(() =>
    getUserPreferences(user.uid)
  );
  const [cycleSettings, setCycleSettings] = useState<CycleSettings>({
    enabled: false,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    lastPeriodStartDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Modals
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [activeSummaryData, setActiveSummaryData] = useState<JournalSummaryData | null>(null);
  const [activeSummaryTitle, setActiveSummaryTitle] = useState('');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Show toast helper with auto-dismiss
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: ToastMessage = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize Preferences & Check Onboarding
  useEffect(() => {
    const prefs = getUserPreferences(user.uid);
    setUserPrefs(prefs);

    getCycleSettings(user.uid).then((cSettings) => {
      setCycleSettings(cSettings);
    });

    // If onboarding never dismissed, present gentle preference card
    if (!prefs.onboardingDismissed) {
      setShowOnboardingModal(true);
    }
  }, [user.uid]);

  // Firestore Real-Time Listener for Reflections
  useEffect(() => {
    if (!user.uid) return;

    setLoadingEntries(true);
    const userEntriesRef = collection(db, 'users', user.uid, 'entries');

    const unsubscribe = onSnapshot(
      userEntriesRef,
      (snapshot) => {
        const loaded: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as JournalEntry;
          loaded.push({
            ...data,
            id: docSnap.id,
          });
        });

        // In-memory sort by updatedAt descending
        loaded.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt).getTime();
          return timeB - timeA;
        });

        setEntries(loaded);
        setLoadingEntries(false);

        // Auto-select latest or maintain selection
        setSelectedEntryId((prevId) => {
          if (prevId && loaded.some((e) => e.id === prevId)) {
            return prevId;
          }
          return loaded.length > 0 ? loaded[0].id : null;
        });
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        setSaveError(`Database sync issue: ${error.message}`);
        setLoadingEntries(false);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  // Create a new reflection entry
  const handleCreateNewEntry = async () => {
    const newId = `entry_${Date.now()}`;
    const newEntry: JournalEntry = {
      id: newId,
      userId: user.uid,
      title: `Reflection on ${new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      tags: [],
    };

    try {
      setIsSaving(true);
      setSaveError(null);
      const cleanPayload = sanitizePayload(newEntry);
      await setDoc(doc(db, 'users', user.uid, 'entries', newId), cleanPayload);
      setSelectedEntryId(newId);
      setActiveTab('journal');
    } catch (err: any) {
      console.error('Failed to create entry in Firestore:', err);
      setSaveError(err?.message || 'Failed to initialize entry in Firestore.');
      setLastPendingEntry(newEntry);
    } finally {
      setIsSaving(false);
    }
  };

  // Update existing entry with defensive sanitization
  const handleUpdateEntry = async (updated: JournalEntry) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setLastPendingEntry(updated);

      const cleanPayload = sanitizePayload({
        ...updated,
        updatedAt: new Date().toISOString(),
      });

      const entryDocRef = doc(db, 'users', user.uid, 'entries', updated.id);
      await setDoc(entryDocRef, cleanPayload, { merge: true });
      setLastPendingEntry(null);
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      setSaveError(err?.message || 'Could not persist reflection to Firestore.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Retry previous failed write
  const handleRetrySave = async () => {
    if (!lastPendingEntry) return;
    await handleUpdateEntry(lastPendingEntry);
  };

  // Request deletion confirmation (Task 1)
  const handleRequestDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPendingDelete({ id, title });
  };

  // Confirm and execute entry deletion (Task 1)
  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;

    try {
      setIsDeleting(true);
      // Immediately delete from Firestore
      await deleteDoc(doc(db, 'users', user.uid, 'entries', id));

      // Update in-memory state immediately
      setEntries((prev) => prev.filter((item) => item.id !== id));

      // If active entry is deleted, gracefully switch to next available reflection
      if (selectedEntryId === id) {
        const remaining = entries.filter((item) => item.id !== id);
        setSelectedEntryId(remaining.length > 0 ? remaining[0].id : null);
      }

      setPendingDelete(null);
      showToast('Entry permanently deleted.', 'info');
    } catch (err: any) {
      console.error('Failed to delete reflection:', err);
      showToast(err?.message || 'Failed to delete entry from Firestore.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Onboarding action: Enable Mindful Cycle Companion
  const handleEnableCycleCompanion = () => {
    const updatedPrefs: UserPreferences = {
      ...userPrefs,
      enableCycleCompanion: true,
      onboardingDismissed: true,
    };
    const updatedSettings: CycleSettings = {
      ...cycleSettings,
      enabled: true,
    };

    saveUserPreferences(user.uid, updatedPrefs);
    saveCycleSettings(user.uid, updatedSettings);

    setUserPrefs(updatedPrefs);
    setCycleSettings(updatedSettings);
    setShowOnboardingModal(false);

    showToast('Mindful Cycle Companion enabled in workspace.', 'success');
    setActiveTab('cycle');
  };

  // Onboarding action: Skip / Dismiss
  const handleDismissOnboarding = () => {
    const updatedPrefs: UserPreferences = {
      ...userPrefs,
      onboardingDismissed: true,
    };
    saveUserPreferences(user.uid, updatedPrefs);
    setUserPrefs(updatedPrefs);
    setShowOnboardingModal(false);
  };

  // Settings update handlers
  const handleToggleCycle = (enabled: boolean) => {
    const updatedPrefs: UserPreferences = {
      ...userPrefs,
      enableCycleCompanion: enabled,
    };
    const updatedSettings: CycleSettings = {
      ...cycleSettings,
      enabled,
    };
    saveUserPreferences(user.uid, updatedPrefs);
    saveCycleSettings(user.uid, updatedSettings);
    setUserPrefs(updatedPrefs);
    setCycleSettings(updatedSettings);

    if (!enabled && activeTab === 'cycle') {
      setActiveTab('journal');
    }
    showToast(enabled ? 'Mindful Cycle Companion enabled.' : 'Mindful Cycle Companion hidden.', 'info');
  };

  const handleUpdateCycleSettings = (newSettings: CycleSettings) => {
    saveCycleSettings(user.uid, newSettings);
    setCycleSettings(newSettings);
    showToast('Cycle parameters saved.', 'success');
  };

  // Open Summary Modal
  const handleOpenSummaryModal = (entry: JournalEntry) => {
    if (!entry.summary) return;
    setActiveSummaryTitle(entry.title);
    setActiveSummaryData({
      summary: entry.summary,
      keyTakeaways: entry.keyTakeaways || [],
      sentiment: entry.sentiment || 'Reflective',
      actionItems: entry.actionItems || [],
    });
    setSummaryModalOpen(true);
  };

  // Save Voice Entry to Firestore and synthesize summary
  const handleSaveVoiceEntry = async (newVoiceEntry: JournalEntry) => {
    await handleUpdateEntry(newVoiceEntry);
    setSelectedEntryId(newVoiceEntry.id);
    setActiveTab('journal');

    if (newVoiceEntry.messages.length > 0) {
      try {
        const summaryData = await requestSummary({
          title: newVoiceEntry.title,
          messages: newVoiceEntry.messages,
        });
        const enrichedEntry: JournalEntry = {
          ...newVoiceEntry,
          summary: summaryData.summary,
          keyTakeaways: summaryData.keyTakeaways,
          sentiment: summaryData.sentiment,
          actionItems: summaryData.actionItems,
          updatedAt: new Date().toISOString(),
        };
        await handleUpdateEntry(enrichedEntry);
        showToast('Voice reflection transcribed and synthesized.', 'success');
      } catch (sumErr) {
        console.warn('Background voice summary skipped:', sumErr);
      }
    }
  };

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);
  const isCycleTabActive = activeTab === 'cycle' && (userPrefs.enableCycleCompanion || cycleSettings.enabled);
  const theme = getRealmTheme(monumentTheme);

  return (
    <div
      id="biophilic-workspace-root"
      className="min-h-screen w-screen h-screen flex text-stone-900 overflow-hidden relative font-sans"
    >
      {/* Monument Valley Ambient Architectural Canvas */}
      <MonumentValleyCanvas theme={monumentTheme} />

      {/* Dynamic Realm Complementary Atmospheric Layer (Stars/Comets, Leaves, Petals, Waves) */}
      <RealmAtmosphereCanvas theme={monumentTheme} />

      {/* Ultra-Minimalist Icon-Only Left Sidebar */}
      <MinimalSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'journal' && !selectedEntryId && entries.length > 0) {
            setSelectedEntryId(entries[0].id);
          }
        }}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        onOpenVoiceModal={() => setVoiceModalOpen(true)}
        onNewEntry={handleCreateNewEntry}
        onOpenSettings={() => setShowSettingsModal(true)}
        cycleEnabled={userPrefs.enableCycleCompanion || cycleSettings.enabled}
        monumentTheme={monumentTheme}
        onCycleTheme={cycleTheme}
        user={user}
        onLogout={onLogout}
      />

      {/* Top Floating Controls */}
      <div className={`absolute top-3 right-3 sm:top-7 sm:right-6 z-30 flex items-center gap-2 sm:gap-3 pointer-events-auto transition-opacity duration-300 ${isHistoryOpen ? 'opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto' : 'opacity-100'}`}>
        <div className="bg-white/70 backdrop-blur-md rounded-full shadow-2xs p-1 sm:p-1.5 border border-white/50 flex items-center justify-center scale-90 sm:scale-100">
          <MonumentChimeToggle 
            muted={isMuted} 
            onToggleMute={(muted) => setIsMuted(muted)} 
          />
        </div>
        <button
          id="workspace-cycle-realm-btn"
          type="button"
          onClick={cycleTheme}
          className={`px-3.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-serif transition-all cursor-pointer shadow-2xs capitalize flex items-center gap-2 active:scale-95 group ${monumentTheme === 'twilight'
              ? 'bg-[#1C182F]/90 hover:bg-[#25203D] border-[#3F375E] text-[#E8E2FA]'
              : monumentTheme === 'sand'
                ? 'bg-white/90 hover:bg-white border-[#EFE3D5] text-stone-800'
                : monumentTheme === 'teal'
                  ? 'bg-white/90 hover:bg-white border-[#D5EAE2] text-stone-800'
                  : 'bg-white/90 hover:bg-white border-[#F2DDE3] text-stone-800'
            }`}
          title="Switch Realm Atmosphere"
        >
          <span
            className="w-2.5 h-2.5 rounded-full shadow-2xs transition-colors duration-500 ring-2 ring-white/30"
            style={{
              backgroundColor:
                monumentTheme === 'twilight'
                  ? '#C084FC'
                  : monumentTheme === 'sand'
                    ? '#EA580C'
                    : monumentTheme === 'teal'
                      ? '#0D9488'
                      : '#E11D48',
            }}
          />
          <span className="font-medium hidden sm:inline">{monumentTheme} Realm</span>
          <span className="font-medium sm:hidden">Realm</span>
        </button>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex h-full overflow-hidden relative z-10 pb-16 md:pb-0">
        {/* Past Reflections Drawer (Collapsible) */}
        {activeTab === 'journal' && (
          <div
            className={`transition-all duration-300 ease-in-out shrink-0 h-full ${isHistoryOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'
              } hidden lg:block overflow-hidden`}
          >
            <EntryHistory
              entries={entries}
              selectedEntryId={selectedEntryId}
              onSelectEntry={(id) => setSelectedEntryId(id)}
              onNewEntry={handleCreateNewEntry}
              onDeleteEntry={handleRequestDelete}
              monumentTheme={monumentTheme}
            />
          </div>
        )}

        {/* Mobile Reflections Drawer */}
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden flex">
            <div
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
              onClick={() => setIsHistoryOpen(false)}
            />
            <div className={`relative w-[85%] max-w-sm h-full ${theme.sidebarBg} shadow-2xl animate-slide-in-left backdrop-blur-3xl`}>
              <EntryHistory
                entries={entries}
                selectedEntryId={selectedEntryId}
                onSelectEntry={(id) => {
                  setSelectedEntryId(id);
                  setIsHistoryOpen(false);
                }}
                onNewEntry={() => {
                  handleCreateNewEntry();
                  setIsHistoryOpen(false);
                }}
                onDeleteEntry={handleRequestDelete}
                monumentTheme={monumentTheme}
                onCloseMobileDrawer={() => setIsHistoryOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Center Spatial Canvas */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Active View Selector */}
          {activeTab === 'wellbeing' ? (
            <WellbeingDashboard
              entries={entries}
              onNewReflection={() => {
                setActiveTab('journal');
                handleCreateNewEntry();
              }}
              onOpenVoiceModal={() => setVoiceModalOpen(true)}
              cycleSettings={cycleSettings}
              onNavigateToCycle={() => setActiveTab('cycle')}
              monumentTheme={monumentTheme}
            />
          ) : isCycleTabActive ? (
            <CycleCompanion
              userId={user.uid}
              cycleSettings={cycleSettings}
              onOpenSettings={() => setShowSettingsModal(true)}
              onShowToast={showToast}
              monumentTheme={monumentTheme}
            />
          ) : loadingEntries ? (
            <div className={`flex-1 flex items-center justify-center flex-col gap-3 ${theme.textSecondary}`}>
              <Loader2 className="w-6 h-6 animate-spin text-stone-500" />
              <p className="text-xs font-medium font-sans">Connecting to private workspace...</p>
            </div>
          ) : selectedEntry ? (
            <EntryEditor
              userId={user.uid}
              previousEntries={entries}
              entry={selectedEntry}
              onUpdateEntry={handleUpdateEntry}
              onOpenSummaryModal={handleOpenSummaryModal}
              onOpenVoiceModal={() => setVoiceModalOpen(true)}
              isSaving={isSaving}
              saveError={saveError}
              onRetrySave={handleRetrySave}
              monumentTheme={monumentTheme}
            />
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 ${theme.textSecondary}`}>
              <div className={`w-16 h-16 rounded-3xl ${theme.cardBg} border ${theme.cardBorder} flex items-center justify-center ${theme.textAccent} mb-5 shadow-sm backdrop-blur-md`}>
                <Feather className="w-8 h-8" />
              </div>
              <h2 className={`text-2xl font-serif font-bold ${theme.textPrimary} mb-2`}>
                Your Reflection Canvas is Ready
              </h2>
              <p className={`text-xs sm:text-sm ${theme.textSecondary} max-w-sm mb-6 leading-relaxed`}>
                Begin a new thought exchange with Gemini or start hands-free voice journaling.
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  id="empty-state-voice-btn"
                  type="button"
                  onClick={() => setVoiceModalOpen(true)}
                  className={`px-5 py-2.5 rounded-xl ${theme.primaryBtn} text-xs font-semibold transition-all shadow-sm cursor-pointer flex items-center gap-2`}
                >
                  <Mic className="w-4 h-4 opacity-90" />
                  <span>Start Voice Reflection</span>
                </button>
                <button
                  id="empty-state-text-btn"
                  type="button"
                  onClick={handleCreateNewEntry}
                  className={`px-5 py-2.5 rounded-xl ${theme.secondaryBtn} font-semibold text-xs transition-all shadow-sm cursor-pointer`}
                >
                  Create Text Reflection
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Task 1: Soft Glassmorphism Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(pendingDelete)}
        entryTitle={pendingDelete?.title || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* Task 3: Privacy-First Cycle Companion Onboarding Modal */}
      <CycleOnboardingModal
        isOpen={showOnboardingModal}
        onEnable={handleEnableCycleCompanion}
        onDismiss={handleDismissOnboarding}
      />

      {/* Settings Modal with Cycle Toggle & Atmosphere Realm Calibration */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        cycleEnabled={userPrefs.enableCycleCompanion || cycleSettings.enabled}
        onToggleCycle={handleToggleCycle}
        cycleSettings={cycleSettings}
        onUpdateCycleSettings={handleUpdateCycleSettings}
        monumentTheme={monumentTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* Structured Summary Modal */}
      <SummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        title={activeSummaryTitle}
        summaryData={activeSummaryData}
        monumentTheme={monumentTheme}
      />

      {/* Live Voice Journal Modal */}
      <VoiceJournalModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        userId={user.uid}
        onSaveVoiceEntry={handleSaveVoiceEntry}
        monumentTheme={monumentTheme}
      />

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};
