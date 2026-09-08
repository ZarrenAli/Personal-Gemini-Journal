import React from 'react';
import { Sparkles, LogOut, ShieldCheck, Database, User as UserIcon, Mic, Radio } from 'lucide-react';
import { AuthUserProfile } from '../types';

interface NavbarProps {
  user: AuthUserProfile;
  onLogout: () => void;
  onNewEntry: () => void;
  onOpenVoiceModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNewEntry, onOpenVoiceModal }) => {
  return (
    <header
      id="app-header"
      className="border-b border-[#E5E1DA] bg-[#FCFAF7]/95 backdrop-blur-md sticky top-0 z-30 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & System Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1D1D1B] text-[#FCFAF7] flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-serif font-bold text-[#1D1D1B] tracking-tight">
                Gemini Reflections
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF2EB] text-[#2D5A34] border border-[#D3E2D4]">
                <ShieldCheck className="w-3 h-3 text-[#2D5A34]" />
                Firestore Isolated
              </span>
            </div>
            <p className="text-xs text-[#6B6864] hidden md:block">
              Multi-turn reflective journaling & live voice conversations with Gemini
            </p>
          </div>
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Voice Journal Button */}
          <button
            id="navbar-voice-journal-btn"
            type="button"
            onClick={onOpenVoiceModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-semibold text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Start hands-free voice journal with Gemini Live API"
          >
            <Mic className="w-4 h-4 text-stone-950 animate-pulse" />
            <span className="whitespace-nowrap font-medium text-white">Voice Journal</span>
          </button>

          <button
            id="navbar-new-entry-btn"
            type="button"
            onClick={onNewEntry}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1D1D1B] hover:bg-[#2F2F2C] text-[#FCFAF7] text-xs sm:text-sm font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span className="whitespace-nowrap">New Reflection</span>
          </button>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#E5E1DA]">
            {user.photoURL ? (
              <img
                id="user-avatar-img"
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-[#E5E1DA] object-cover"
              />
            ) : (
              <div
                id="user-avatar-placeholder"
                className="w-8 h-8 rounded-full bg-[#EAE6DE] text-[#1D1D1B] flex items-center justify-center text-xs font-semibold"
              >
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
            )}

            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-[#1D1D1B] leading-tight truncate max-w-[130px]">
                {user.displayName || 'Journaler'}
              </div>
              <div className="text-[11px] text-[#6B6864] truncate max-w-[130px]">
                {user.email}
              </div>
            </div>

            <button
              id="logout-btn"
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-[#6B6864] hover:text-[#1D1D1B] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
