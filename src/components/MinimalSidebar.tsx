import React from 'react';
import {
  Plus,
  Layers,
  Mic,
  Activity,
  Heart,
  Settings,
  LogOut,
  User as UserIcon,
  Compass,
} from 'lucide-react';
import { AuthUserProfile } from '../types';
import { monumentSound } from '../lib/monumentSound';
import { getRealmTheme } from '../lib/realmTheme';

interface MinimalSidebarProps {
  activeTab: 'journal' | 'cycle' | 'wellbeing';
  onSelectTab: (tab: 'journal' | 'cycle' | 'wellbeing') => void;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  onOpenVoiceModal: () => void;
  onNewEntry: () => void;
  onOpenSettings: () => void;
  cycleEnabled: boolean;
  monumentTheme: 'rose' | 'twilight' | 'sand' | 'teal';
  onCycleTheme: () => void;
  user: AuthUserProfile;
  onLogout: () => void;
}

export const MinimalSidebar: React.FC<MinimalSidebarProps> = ({
  activeTab,
  onSelectTab,
  isHistoryOpen,
  onToggleHistory,
  onOpenVoiceModal,
  onNewEntry,
  onOpenSettings,
  cycleEnabled,
  monumentTheme,
  onCycleTheme,
  user,
  onLogout,
}) => {
  const theme = getRealmTheme(monumentTheme);

  const handleTabClick = (tab: 'journal' | 'cycle' | 'wellbeing') => {
    monumentSound.playStoneClick(1.0);
    monumentSound.playNextMelodicChime(0.08);
    onSelectTab(tab);
  };

  const handleNewEntryClick = () => {
    monumentSound.playHarmonicResolve();
    onSelectTab('journal');
    onNewEntry();
  };

  const handleToggleHistoryClick = () => {
    monumentSound.playStoneClick(1.2);
    if (activeTab !== 'journal') {
      onSelectTab('journal');
    }
    onToggleHistory();
  };

  const handleVoiceModalClick = () => {
    monumentSound.playHarmonicResolve();
    onOpenVoiceModal();
  };

  return (
    <nav
      id="minimal-workspace-sidebar"
      aria-label="Monument Workspace Navigation"
      className={`fixed bottom-0 left-0 w-full h-16 md:relative md:w-18 md:h-full ${theme.sidebarBg} border-t md:border-t-0 md:border-r ${theme.sidebarBorder} flex flex-row md:flex-col items-center justify-between px-2 sm:px-4 md:px-0 md:py-5 z-50 shrink-0 select-none shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-xs transition-colors duration-300 backdrop-blur-3xl`}
    >
      {/* Top Monument Navigation Actions */}
      <div className="flex flex-row md:flex-col items-center gap-1 sm:gap-2 md:gap-4 w-auto md:w-full">
        {/* Quick New Reflection / Inscription */}
        <div className="relative group">
          <button
            id="sidebar-quick-new-btn"
            type="button"
            onClick={handleNewEntryClick}
            className="w-10 h-10 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-200 flex items-center justify-center shadow-md shadow-stone-950/15 transition-all cursor-pointer active:scale-95 border border-amber-300/30"
            title="Inscribe New Reflection"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="hidden md:block w-6 h-px bg-stone-300/60 my-0.5" />

        {/* Functional Nav Items Stack */}
        <div className="flex flex-row md:flex-col items-center gap-1 sm:gap-2 md:gap-3 w-auto md:w-full overflow-x-auto no-scrollbar px-1 md:px-0">
          {/* Past Reflections Drawer Toggle */}
          <div className="relative group w-auto md:w-full flex justify-center shrink-0">
            <button
              id="nav-history-drawer-btn"
              type="button"
              onClick={handleToggleHistoryClick}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isHistoryOpen && activeTab === 'journal'
                  ? `${theme.pillActive}`
                  : `text-stone-600 ${theme.sidebarHover}`
              }`}
              title="Monuments Library"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>

          {/* Live Voice Companion */}
          <div className="relative group w-auto md:w-full flex justify-center shrink-0">
            <button
              id="nav-voice-modal-btn"
              type="button"
              onClick={handleVoiceModalClick}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${theme.textAccent} ${theme.sidebarHover} border ${theme.cardBorder} ${theme.cardBg} transition-all cursor-pointer shadow-xs`}
              title="Speak with the Whispering Totem"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* Wellbeing & Emotional Progression Dashboard */}
          <div className="relative group w-auto md:w-full flex justify-center shrink-0">
            <button
              id="nav-wellbeing-dashboard-btn"
              type="button"
              onClick={() => handleTabClick('wellbeing')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'wellbeing'
                  ? `${theme.pillActive}`
                  : `text-stone-600 ${theme.sidebarHover}`
              }`}
              title="Emotional Climate & Constellations"
            >
              <Activity className="w-5 h-5" />
            </button>
          </div>

          {/* Mindful Cycle Companion Tab */}
          {cycleEnabled && (
            <div className="relative group w-auto md:w-full flex justify-center animate-fade-in shrink-0">
              <button
                id="nav-cycle-companion-btn"
                type="button"
                onClick={() => handleTabClick('cycle')}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'cycle'
                    ? `${theme.pillActive}`
                    : `text-stone-600 ${theme.sidebarHover}`
                }`}
                title="Sacred Rhythm Almanac"
              >
                <Heart className={`w-5 h-5 ${theme.textAccent}`} />
              </button>
            </div>
          )}



          {/* Settings Modal Toggle */}
          <div className="relative group w-auto md:w-full flex justify-center shrink-0">
            <button
              id="nav-settings-btn"
              type="button"
              onClick={() => {
                monumentSound.playStoneClick(1.0);
                onOpenSettings();
              }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-stone-500 ${theme.sidebarHover} transition-all cursor-pointer`}
              title="Sacred Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom User Avatar & Logout */}
      <div className={`flex flex-row md:flex-col items-center gap-2 md:gap-3 w-auto pt-0 pl-2 md:pl-0 md:pt-4 border-l md:border-l-0 md:border-t ${theme.sidebarBorder} shrink-0`}>
        {/* User Avatar */}
        <div className="relative group">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Silent Wanderer'}
              referrerPolicy="no-referrer"
              className={`w-9 h-9 rounded-2xl border ${theme.cardBorder} object-cover shadow-2xs`}
            />
          ) : (
            <div className={`w-9 h-9 rounded-2xl ${theme.accentIconBg} border ${theme.accentIconBorder} ${theme.textAccent} flex items-center justify-center text-xs font-serif shadow-2xs`}>
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <Compass className="w-4 h-4" />}
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="relative group">
          <button
            id="nav-logout-btn"
            type="button"
            onClick={() => {
              monumentSound.playHarmonicResolve();
              onLogout();
            }}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center text-stone-400 ${theme.sidebarHover} transition-colors cursor-pointer`}
            title="Depart Chamber"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
