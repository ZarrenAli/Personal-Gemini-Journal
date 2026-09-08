import React, { useState } from 'react';
import { JournalEntry } from '../types';
import {
  Search,
  Plus,
  Trash2,
  Calendar,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react';
import { getMoodVisual, MoodCategoryType } from '../lib/sentimentUtils';
import { monumentSound } from '../lib/monumentSound';
import { getRealmTheme, MonumentRealmTheme } from '../lib/realmTheme';

interface EntryHistoryProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (id: string) => void;
  onNewEntry: () => void;
  onDeleteEntry: (id: string, title: string, e: React.MouseEvent) => void;
  onCloseMobileDrawer?: () => void;
  monumentTheme?: MonumentRealmTheme;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  onCloseMobileDrawer,
  monumentTheme = 'rose',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<'all' | MoodCategoryType>('all');
  const theme = getRealmTheme(monumentTheme);

  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = entry.title.toLowerCase().includes(query);
    const textMatch = entry.messages.some((msg) =>
      msg.text.toLowerCase().includes(query)
    );
    const tagMatch = entry.tags?.some((tag) => tag.toLowerCase().includes(query));
    const sentimentMatch = (entry.sentiment || '').toLowerCase().includes(query);
    const textPasses = titleMatch || textMatch || tagMatch || sentimentMatch;

    if (!textPasses) return false;

    if (selectedMoodFilter === 'all') return true;
    const visual = getMoodVisual(entry.sentiment, entry.moodCategory);
    return visual.category === selectedMoodFilter;
  });

  const MOOD_FILTERS: { id: 'all' | MoodCategoryType; label: string }[] = [
    { id: 'all', label: 'All Monuments' },
    { id: 'calm', label: 'Calm' },
    { id: 'uplifted', label: 'Joy' },
    { id: 'reflective', label: 'Reflective' },
    { id: 'vulnerable', label: 'Tender' },
    { id: 'unsettled', label: 'Processing' },
  ];

  const handleEntryClick = (id: string) => {
    monumentSound.playStoneClick(1.0);
    monumentSound.playNextMelodicChime(0.09);
    onSelectEntry(id);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  const handleFilterClick = (id: 'all' | MoodCategoryType) => {
    monumentSound.playStoneClick(1.2);
    setSelectedMoodFilter(id);
  };

  return (
    <aside
      id="entry-history-sidebar"
      className={`w-80 border-r ${theme.sidebarBorder} ${theme.sidebarBg} flex flex-col h-full shrink-0 text-stone-900 select-none shadow-xs transition-colors duration-300`}
    >
      {/* Search and New Monument Inscription Header */}
      <div className={`p-3.5 sm:p-4 border-b ${theme.sidebarBorder} space-y-2.5 bg-white/40`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-serif font-semibold tracking-wider text-stone-900 uppercase">
              Monument Library
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${theme.accentBadge} font-mono font-medium`}>
              {entries.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="sidebar-new-entry-btn"
              type="button"
              onClick={() => {
                monumentSound.playHarmonicResolve();
                onNewEntry();
              }}
              className="p-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Carve New Reflection Tablet"
            >
              <Plus className="w-4 h-4 text-stone-700" />
            </button>

            {onCloseMobileDrawer && (
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 lg:hidden"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tablets & memories..."
            className={`w-full pl-9 pr-3 py-1.5 rounded-xl ${theme.inputBg} border ${theme.inputBorder} text-xs text-stone-900 placeholder:text-stone-400 ${theme.inputFocus} transition-all shadow-2xs`}
          />
        </div>

        {/* Mood Category Filter Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 pt-1 no-scrollbar text-[10px]">
          {MOOD_FILTERS.map((filter) => {
            const isFilterActive = selectedMoodFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => handleFilterClick(filter.id)}
                className={`px-2 py-0.5 rounded-lg font-serif font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  isFilterActive
                    ? 'bg-stone-900 text-amber-200 border-stone-900 shadow-2xs'
                    : 'bg-white/70 text-stone-700 border-stone-200/80 hover:bg-white hover:text-stone-950'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entries List (Rendered as Isometric Monument Tablets) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 px-4 text-stone-400 text-xs font-serif">
            {searchQuery || selectedMoodFilter !== 'all' ? (
              <div className="space-y-2">
                <p>No sacred tablets match your current query.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMoodFilter('all');
                  }}
                  className={`text-xs ${theme.textAccent} underline hover:opacity-80 cursor-pointer`}
                >
                  Restore complete library
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p>No reflections recorded in this chamber yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    monumentSound.playHarmonicResolve();
                    onNewEntry();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-amber-200 text-xs hover:bg-stone-800 shadow-xs border border-amber-400/20 cursor-pointer font-serif"
                >
                  Inscribe your first tablet
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredEntries.map((item) => {
            const isSelected = item.id === selectedEntryId;
            const lastMsg = item.messages[item.messages.length - 1];
            const isVoice = item.tags?.includes('Voice Journal');
            const moodVisual = getMoodVisual(item.sentiment, item.moodCategory);
            const MoodIcon = moodVisual.icon;

            return (
              <div
                key={item.id}
                id={`history-entry-${item.id}`}
                onClick={() => handleEntryClick(item.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                  isSelected
                    ? `bg-white/95 ${theme.cardActiveBorder} ${theme.cardActiveRing} translate-x-0.5`
                    : `bg-white/60 ${theme.cardBorder} hover:bg-white/90 ${theme.cardBorderHover}`
                }`}
              >
                {/* Header with Mood Visual Indicator & Title */}
                <div className="flex items-start gap-2.5">
                  {/* Color-Coded Mood Icon Indicator */}
                  <div
                    id={`history-entry-mood-${item.id}`}
                    className={`w-7 h-7 rounded-xl border shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs ${moodVisual.iconBg} ${moodVisual.badgeBorder} ${moodVisual.iconColor}`}
                    title={
                      item.sentiment
                        ? `Atmosphere: ${item.sentiment}${item.sentimentSummary ? ` • ${item.sentimentSummary}` : ''}`
                        : 'Atmosphere not yet analyzed'
                    }
                  >
                    <MoodIcon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3
                        className={`text-sm font-serif truncate leading-snug ${
                          isSelected ? `${theme.textPrimary} font-semibold` : 'text-stone-900 font-medium'
                        }`}
                      >
                        {item.title || 'Untitled Chamber'}
                      </h3>

                      {/* Delete Entry Button with Confirmation Modal Trigger */}
                      <button
                        id={`delete-entry-${item.id}-btn`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onDeleteEntry(item.id, item.title || 'Untitled Chamber', e);
                        }}
                        title="Dismantle Tablet"
                        className="p-1 rounded-lg text-stone-300 hover:text-rose-700 hover:bg-rose-50 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Excerpt */}
                    <p className="text-[11px] text-stone-600 line-clamp-2 mt-1 leading-relaxed font-sans">
                      {lastMsg ? lastMsg.text : 'Quiet space...'}
                    </p>
                  </div>
                </div>

                {/* Meta details & Sentiment Mood Tag */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-100 text-[10px] text-stone-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Visual Sentiment Tag */}
                    {item.sentiment ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-sans font-medium border ${moodVisual.badgeBg} ${moodVisual.badgeText} ${moodVisual.badgeBorder}`}
                        title={item.sentimentSummary || `Detected Atmosphere: ${item.sentiment}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${moodVisual.dotColor}`} />
                        <span className="truncate max-w-[85px]">{item.sentiment}</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-sans text-stone-400 bg-stone-100 border border-stone-200"
                        title="Atmosphere not yet analyzed"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-stone-400" />
                        Unanalyzed
                      </span>
                    )}

                    {isVoice && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] ${theme.accentBadge}`}>
                        Voice
                      </span>
                    )}

                    <span className="flex items-center gap-0.5 text-stone-600">
                      <MessageSquare className="w-3 h-3" />
                      {item.messages.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
