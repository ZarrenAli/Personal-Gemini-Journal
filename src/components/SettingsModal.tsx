import React from 'react';
import { Settings, X, Heart, Shield, Sparkles, Check, Database, RefreshCw, Compass } from 'lucide-react';
import { CycleSettings } from '../types';
import { MonumentRealmTheme, getRealmTheme } from '../lib/realmTheme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleEnabled: boolean;
  onToggleCycle: (enabled: boolean) => void;
  cycleSettings: CycleSettings;
  onUpdateCycleSettings: (settings: CycleSettings) => void;
  monumentTheme?: MonumentRealmTheme;
  onSelectTheme?: (theme: MonumentRealmTheme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  cycleEnabled,
  onToggleCycle,
  cycleSettings,
  onUpdateCycleSettings,
  monumentTheme = 'rose',
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const theme = getRealmTheme(monumentTheme);

  const realms: Array<{
    id: MonumentRealmTheme;
    name: string;
    description: string;
    bgClass: string;
    accentClass: string;
  }> = [
      {
        id: 'rose',
        name: 'Taj Mahal (Rose)',
        description: 'Mughal marble symmetry & drifting petals',
        bgClass: 'bg-rose-100 border-rose-300',
        accentClass: 'bg-rose-500',
      },
      {
        id: 'sand',
        name: 'Pyramids of Giza (Sand)',
        description: 'Ancient pyramids & ocean waves',
        bgClass: 'bg-amber-100 border-amber-300',
        accentClass: 'bg-amber-600',
      },
      {
        id: 'teal',
        name: 'Badshahi Mosque (Teal)',
        description: 'Imperial marble domes & quiet courtyard',
        bgClass: 'bg-teal-100 border-teal-300',
        accentClass: 'bg-teal-600',
      },
      {
        id: 'twilight',
        name: 'Van Fortress (Twilight)',
        description: 'Ancient rock citadel & starry sky',
        bgClass: 'bg-indigo-100 border-indigo-300',
        accentClass: 'bg-indigo-600',
      },
    ];

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto p-2.5 sm:p-4 md:p-6 bg-black/40 backdrop-blur-2xl animate-fade-in flex flex-col justify-start sm:justify-center items-center"
      onClick={onClose}
    >
      <div
        id="settings-modal-card"
        className={`my-auto mx-auto w-full max-w-lg rounded-2xl sm:rounded-3xl ${theme.cardBg} border ${theme.cardBorder} p-5 sm:p-7 shadow-2xl backdrop-blur-3xl ${theme.textPrimary} relative space-y-5 sm:space-y-6 max-h-[calc(100dvh-1.25rem)] sm:max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between border-b ${theme.cardBorder} pb-3 sm:pb-4`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${theme.accentIconBg} border ${theme.accentIconBorder} flex items-center justify-center ${theme.accentIconColor} shrink-0`}>
              <Settings className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-serif font-semibold ${theme.textPrimary} truncate`}>
                Workspace Preferences
              </h3>
              <p className={`text-[11px] sm:text-xs ${theme.textSecondary} truncate`}>
                Configure your biophilic focus environment and privacy modules
              </p>
            </div>
          </div>
          <button
            id="close-settings-btn"
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg ${theme.textMuted} hover:${theme.textPrimary} transition-colors cursor-pointer shrink-0 ml-2`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>



        {/* Mindful Cycle Companion Toggle */}
        <div className={`p-4 rounded-2xl bg-white/10 backdrop-blur-md border ${theme.cardBorder} space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl ${theme.accentIconBg} border ${theme.accentIconBorder} flex items-center justify-center ${theme.accentIconColor} shrink-0 mt-0.5`}>
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-sm font-semibold ${theme.textPrimary} block`}>
                  Enable Mindful Cycle Companion
                </span>
                <p className={`text-xs ${theme.textSecondary} leading-relaxed mt-0.5`}>
                  Displays the dedicated menstrual & hormonal rhythm tracking tab in your workspace navigation.
                </p>
              </div>
            </div>

            <button
              id="toggle-cycle-companion-btn"
              type="button"
              role="switch"
              aria-checked={cycleEnabled}
              onClick={() => onToggleCycle(!cycleEnabled)}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer relative shrink-0 ${cycleEnabled ? theme.accentDot : 'bg-stone-300'
                }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${cycleEnabled ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          {cycleEnabled && (
            <div className={`pt-3 border-t ${theme.cardBorder} space-y-3 animate-fade-in`}>
              <span className={`text-[11px] font-semibold tracking-wider uppercase ${theme.accentIconColor} block`}>
                Rhythm Parameters (Stored Locally)
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className={`${theme.textSecondary} block mb-1`}>Avg Cycle Length (days)</label>
                  <input
                    id="settings-cycle-length-input"
                    type="number"
                    min="21"
                    max="45"
                    value={cycleSettings.averageCycleLength}
                    onChange={(e) =>
                      onUpdateCycleSettings({
                        ...cycleSettings,
                        averageCycleLength: parseInt(e.target.value) || 28,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl ${theme.inputBg} border ${theme.inputBorder} ${theme.textPrimary} ${theme.inputFocus}`}
                  />
                </div>

                <div>
                  <label className={`${theme.textSecondary} block mb-1`}>Avg Period (days)</label>
                  <input
                    id="settings-period-length-input"
                    type="number"
                    min="2"
                    max="10"
                    value={cycleSettings.averagePeriodLength}
                    onChange={(e) =>
                      onUpdateCycleSettings({
                        ...cycleSettings,
                        averagePeriodLength: parseInt(e.target.value) || 5,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl ${theme.inputBg} border ${theme.inputBorder} ${theme.textPrimary} ${theme.inputFocus}`}
                  />
                </div>
              </div>

              <div>
                <label className={`${theme.textSecondary} text-xs block mb-1`}>Last Period Start Date</label>
                <input
                  id="settings-last-period-input"
                  type="date"
                  value={cycleSettings.lastPeriodStartDate}
                  onChange={(e) =>
                    onUpdateCycleSettings({
                      ...cycleSettings,
                      lastPeriodStartDate: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl ${theme.inputBg} border ${theme.inputBorder} ${theme.textPrimary} text-xs ${theme.inputFocus}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Privacy badge */}
        <div className={`p-3.5 rounded-xl ${theme.accentIconBg} border ${theme.cardBorder} flex items-center gap-3 text-xs ${theme.textSecondary}`}>
          <Shield className={`w-4 h-4 ${theme.accentIconColor} shrink-0`} />
          <span>Health records remain sealed in client-side storage and are never uploaded to cloud logs.</span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            id="done-settings-btn"
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl ${theme.primaryBtn} text-white text-xs font-medium border border-white/30 transition-all cursor-pointer shadow-xs`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
