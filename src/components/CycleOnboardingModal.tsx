import React from 'react';
import { Heart, ShieldCheck, Sparkles, X, Check } from 'lucide-react';

interface CycleOnboardingModalProps {
  isOpen: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}

export const CycleOnboardingModal: React.FC<CycleOnboardingModalProps> = ({
  isOpen,
  onEnable,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="cycle-onboarding-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto p-2.5 sm:p-4 md:p-6 bg-[#0F172A]/80 backdrop-blur-2xl animate-fade-in flex flex-col justify-start sm:justify-center items-center"
    >
      <div
        id="cycle-onboarding-card"
        className="my-auto mx-auto w-full max-w-lg rounded-2xl sm:rounded-3xl bg-[#0F172A]/95 border border-[#B0A8B9]/30 p-5 sm:p-7 shadow-2xl backdrop-blur-3xl text-slate-100 relative overflow-hidden max-h-[calc(100dvh-1.25rem)] sm:max-h-[90vh] overflow-y-auto"
      >
        {/* Soft pastel ambient glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#E6C7C2]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-[#A3B18A]/15 blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E6C7C2]/20 to-[#B0A8B9]/20 border border-[#B0A8B9]/40 flex items-center justify-center text-[#E6C7C2] shadow-sm">
            <Heart className="w-6 h-6 fill-[#E6C7C2]/30 text-[#E6C7C2]" />
          </div>
          <button
            id="dismiss-onboarding-x-btn"
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="Skip for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#B0A8B9]/20 text-[#B0A8B9] border border-[#B0A8B9]/30">
            <Sparkles className="w-3 h-3" />
            <span>Workspace Personalization</span>
          </div>

          <h3 className="text-xl font-serif font-semibold text-slate-100">
            Would you like to enable the Mindful Cycle Companion on your workspace?
          </h3>

          <p className="text-sm text-slate-300 leading-relaxed font-sans pt-1">
            A dedicated, sensitive wellness sanctuary to track menstrual rhythms, physical symptoms, and emotional fluctuations alongside your reflections, with compassionate coaching from Gemini.
          </p>
        </div>

        {/* Privacy First Callout */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-900/60 border border-[#A3B18A]/30 flex items-start gap-3 relative z-10">
          <ShieldCheck className="w-5 h-5 text-[#A3B18A] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-slate-200 block">Privacy-First Guarantee</span>
            <p className="text-slate-400 leading-relaxed">
              All symptom and cycle data is kept strictly inside your local browser vault. It is never synced to public cloud databases or used to train public AI models.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 relative z-10">
          <button
            id="onboarding-skip-btn"
            type="button"
            onClick={onDismiss}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
          >
            Keep Hidden / Skip for now
          </button>

          <button
            id="onboarding-enable-btn"
            type="button"
            onClick={onEnable}
            className="px-5 py-2.5 rounded-xl text-xs font-medium text-[#0F172A] bg-gradient-to-r from-[#E6C7C2] via-[#B0A8B9] to-[#A3B18A] hover:opacity-95 font-semibold transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Enable Companion Tab</span>
          </button>
        </div>
      </div>
    </div>
  );
};
