import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Lock,
  AlertCircle,
  Sparkles,
  Mic,
  TrendingUp,
  Compass,
  Volume2,
  ChevronDown,
  CheckCircle2,
  Feather,
  Heart,
  HeartHandshake,
  Activity,
} from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { MonumentValleyCanvas } from './MonumentValleyCanvas';
import { RealmAtmosphereCanvas } from './RealmAtmosphereCanvas';
import { MonumentChimeToggle } from './MonumentChimeToggle';
import { monumentSound } from '../lib/monumentSound';

interface AuthLandingProps {
  onAuthSuccess?: () => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = () => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [chimesMuted, setChimesMuted] = useState<boolean>(false);
  const [monumentTheme, setMonumentTheme] = useState<'rose' | 'twilight' | 'sand' | 'teal'>(() => {
    const saved = localStorage.getItem('monument_realm_theme');
    if (saved === 'rose' || saved === 'twilight' || saved === 'sand' || saved === 'teal') {
      return saved as any;
    }
    return 'sand';
  });

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

  const handleGoogleLogin = async () => {
    monumentSound.playHarmonicResolve();
    try {
      setLoading(true);
      setAuthError(null);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login failure:', err);
      if (err?.code === 'auth/popup-blocked') {
        setAuthError(
          'Sign-in popup was blocked by your browser. Please allow popups or open the app in a new tab.'
        );
      } else if (
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-closed-by-user'
      ) {
        setAuthError('Sign-in was cancelled. Please click below to try again.');
      } else {
        setAuthError(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cycleTheme = () => {
    const themes: ('rose' | 'twilight' | 'sand' | 'teal')[] = ['rose', 'sand', 'teal', 'twilight'];
    const next = themes[(themes.indexOf(monumentTheme) + 1) % themes.length];
    setMonumentTheme(next);
    localStorage.setItem('monument_realm_theme', next);
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('sanctuary-features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-rose-500/20 selection:text-rose-950">
      {/* Realm Sky Atmosphere Canvas (Fixed gradient backdrop) */}
      <MonumentValleyCanvas theme={monumentTheme} />

      {/* ======================================================== */}
      {/* SECTION 1: HERO VISTA (Full-screen contemplative entrance) */}
      {/* ======================================================== */}
      <section className="h-screen min-h-screen max-h-screen flex flex-col justify-between items-center relative overflow-hidden pb-4 sm:pb-6">
        {/* Dynamic Realm Complementary Atmospheric Layer (Stars, Leaves, Petals, Waves) */}
        <RealmAtmosphereCanvas theme={monumentTheme} />

        {/* Floating Top-Right Realm Switcher & Sound Chime Capsule */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-40 flex items-center">
          <div
            className={`flex items-center gap-1.5 backdrop-blur-md py-1.5 px-3 rounded-full border shadow-sm transition-all duration-500 ${monumentTheme === 'twilight'
              ? 'bg-[#1C182F]/20 hover:bg-[#25203D]/40 border-[#3F375E] text-[#E8E2FA]'
              : monumentTheme === 'sand'
                ? 'bg-white/20 hover:bg-white/40 border-[#EFE3D5] text-stone-800'
                : monumentTheme === 'teal'
                  ? 'bg-white/20 hover:bg-white/40 border-[#D5EAE2] text-stone-800'
                  : 'bg-white/20 hover:bg-white/40 border-[#F2DDE3] text-stone-800'
              }`}
          >
            <button
              id="cycle-realm-btn"
              type="button"
              onClick={cycleTheme}
              className={`text-xs font-serif font-medium transition-colors cursor-pointer capitalize flex items-center gap-2 py-0.5 ${monumentTheme === 'twilight'
                ? 'text-[#F3EFFE] hover:text-white'
                : 'text-stone-800 hover:text-stone-950'
                }`}
              title="Click to Switch Realm Atmosphere"
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
              <span>{monumentTheme} Realm</span>
            </button>
            <div
              className={`w-[1px] h-3.5 mx-0.5 ${monumentTheme === 'twilight' ? 'bg-[#3F375E]' : 'bg-stone-300/80'
                }`}
            />
            <MonumentChimeToggle
              muted={chimesMuted}
              onToggleMute={setChimesMuted}
            />
          </div>
        </div>

        {/* Top spacer to balance vertical centering */}
        <div className="flex-1 w-full" />

        {/* ZONE 1: Contemplative Hero Typography (Centered gracefully in the vista) */}
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 flex flex-col items-center relative z-20 shrink-0 my-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col items-center text-center"
          >
            <h1
              className={`text-3xl sm:text-5xl md:text-6xl font-serif font-light tracking-tight leading-tight transition-colors duration-500 ${monumentTheme === 'twilight' ? 'text-white' : 'text-stone-900'
                }`}
            >
              <span className="block">Pause. Breathe.</span>
              <span
                className={`block mt-1 sm:mt-2 font-normal italic transition-colors duration-500 whitespace-nowrap ${monumentTheme === 'twilight'
                  ? 'text-purple-300'
                  : monumentTheme === 'teal'
                    ? 'text-teal-800'
                    : monumentTheme === 'sand'
                      ? 'text-amber-800'
                      : 'text-rose-800'
                  }`}
              >
                Discover your center.
              </span>
            </h1>
          </motion.div>
        </div>

        {/* Bottom spacer to preserve generous open space above the login button */}
        <div className="flex-1 w-full min-h-[40px]" />

        {/* ZONE 3: Bottom Google Login Portal */}
        <div className="w-full max-w-md mx-auto px-6 flex flex-col items-center text-center relative z-20 shrink-0 pb-2">
          {authError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 max-w-md p-3 rounded-2xl bg-rose-50/90 backdrop-blur-md border border-rose-200 text-rose-900 text-xs flex items-start gap-2 text-left shadow-2xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </motion.div>
          )}

          {/* Sacred Geometry Login Portal Pill */}
          <div className="flex flex-col items-center justify-center">
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              aria-label="Sign in with Google"
              className="group relative flex items-center gap-3.5 px-8 py-3.5 rounded-full bg-white/20 hover:bg-white/30 dark:bg-stone-900/20 dark:hover:bg-stone-900/30 backdrop-blur-2xl border border-white/50 dark:border-stone-700/80 shadow-xl shadow-stone-900/5 hover:shadow-rose-900/15 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-rose-300/50 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {/* Ambient Glow Aura */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-rose-400/25 via-amber-300/25 to-teal-400/25 blur-md group-hover:blur-lg transition-all duration-500 -z-10 animate-pulse" />

              {/* Google G Emblem */}
              <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-stone-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z"
                    />
                  </svg>
                )}
              </div>

              {/* Call to Action Text */}
              <div className="flex flex-col items-start text-left pr-2">
                <span className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100 group-hover:text-rose-900 dark:group-hover:text-purple-300 transition-colors">
                  {loading ? 'Opening Sanctuary...' : 'Enter Sanctuary'}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-sans tracking-wide">
                  Sign in with Google
                </span>
              </div>
            </button>
          </div>

          {/* Scroll Down Cue */}
          <button
            type="button"
            onClick={scrollToFeatures}
            className="mt-4 flex flex-col items-center gap-1 text-[11px] font-serif text-stone-500/80 hover:text-stone-800 dark:text-stone-400/80 dark:hover:text-stone-200 transition-all cursor-pointer group"
          >
            <span className="tracking-wide">Explore Features</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce group-hover:translate-y-0.5 transition-transform text-stone-400" />
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: ENGAGING FEATURES SHOWCASE (Scrollable below) */}
      {/* ======================================================== */}
      <section
        id="sanctuary-features"
        className="relative z-20 w-full max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 flex flex-col items-center"
      >
        {/* Section Header */}
        <div className="text-center max-w-2xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-stone-800/70 border border-stone-200/70 dark:border-stone-700/60 backdrop-blur-md shadow-xs text-xs font-medium text-stone-700 dark:text-stone-200 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>A Sanctuary for the Modern Mind</span>
          </div>
          <h2
            className={`text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight leading-tight mb-4 ${monumentTheme === 'twilight' ? 'text-white' : 'text-stone-900'
              }`}
          >
            Clear your thoughts. <br className="hidden sm:inline" />
            <span className="italic font-normal">Find calm in every reflection.</span>
          </h2>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed">
            A private space combining empathetic AI insights, effortless voice journaling, and soothing soundscapes to help you untangle your day.
          </p>
        </div>

        {/* Feature Cards Grid (6 High-Converting Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">

          {/* CARD 1: Gemini AI Depth Reflections */}
          <div className="group relative rounded-3xl bg-white/10 dark:bg-stone-900/10 backdrop-blur-md border border-white/80 dark:border-stone-800/80 p-7 shadow-lg shadow-stone-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100/80 dark:bg-rose-950/50 flex items-center justify-center mb-5 border border-rose-200/60 dark:border-rose-800/40 text-rose-600 dark:text-rose-300 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="inline-block text-[11px] font-sans font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5">
                A Listening Ear
              </div>
              <h3 className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-2.5">
                AI Reflections
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                Pour out your thoughts freely. Receive gentle, unbiased reflections that help you find clarity and uncover hidden patterns in your mind.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-stone-800/60 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clarity without judgment</span>
            </div>
          </div>

          {/* CARD 2: Live Voice Journaling */}
          <div className="group relative rounded-3xl bg-white/10 dark:bg-stone-900/10 backdrop-blur-md border border-white/80 dark:border-stone-800/80 p-7 shadow-lg shadow-stone-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100/80 dark:bg-teal-950/50 flex items-center justify-center mb-5 border border-teal-200/60 dark:border-teal-800/40 text-teal-600 dark:text-teal-300 group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <div className="inline-block text-[11px] font-sans font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1.5">
                Speak Freely
              </div>
              <h3 className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-2.5">
                Voice Journaling
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                When you're too exhausted to type, simply tap the mic and talk. Your raw emotions are safely captured and transcribed as you speak.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-stone-800/60 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
              <span>Capture thoughts effortlessly</span>
            </div>
          </div>

          {/* CARD 3: Emotional Progression & Trends */}
          <div className="group relative rounded-3xl bg-white/10 dark:bg-stone-900/10 backdrop-blur-md border border-white/80 dark:border-stone-800/80 p-7 shadow-lg shadow-stone-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100/80 dark:bg-amber-950/50 flex items-center justify-center mb-5 border border-amber-200/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="inline-block text-[11px] font-sans font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                Inner Growth
              </div>
              <h3 className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-2.5">
                Emotional Trends
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                Watch how your headspace evolves over time. Discover what triggers your feelings and celebrate milestones in your personal wellbeing journey.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-stone-800/60 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Track your emotional shifts</span>
            </div>
          </div>

          {/* CARD 4: Women & Girls Menstrual Cycle & Hormonal State Tracker */}
          <div className="group relative rounded-3xl bg-white/10 dark:bg-stone-900/10 backdrop-blur-md border border-white/80 dark:border-stone-800/80 p-7 shadow-lg shadow-stone-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100/80 dark:bg-rose-950/50 flex items-center justify-center mb-5 border border-rose-200/60 dark:border-rose-800/40 text-rose-600 dark:text-rose-300 group-hover:scale-105 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <div className="inline-block text-[11px] font-sans font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5">
                Body &amp; Mind
              </div>
              <h3 className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-2.5">
                Cycle Insights
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                Connect your journal with your menstrual cycle. Uncover how your natural rhythms subtly influence your daily moods, energy, and overall state of mind.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-stone-800/60 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Link rhythms to your emotions</span>
            </div>
          </div>

          {/* CARD 5: 4 Tactile Realm Soundscapes */}
          <div className="group relative rounded-3xl bg-white/10 dark:bg-stone-900/10 backdrop-blur-md border border-white/80 dark:border-stone-800/80 p-7 shadow-lg shadow-stone-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100/80 dark:bg-purple-950/50 flex items-center justify-center mb-5 border border-purple-200/60 dark:border-purple-800/40 text-purple-600 dark:text-purple-300 group-hover:scale-105 transition-transform">
                <Volume2 className="w-6 h-6" />
              </div>
              <div className="inline-block text-[11px] font-sans font-medium uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1.5">
                Sensory Calm
              </div>
              <h3 className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-2.5">
                Serene Atmospheres
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                Step away from the noise. Immerse yourself in calming visual realms and gentle wind chimes designed to help you breathe and center your focus.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-stone-800/60 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
              <span>Audio and visual tranquility</span>
            </div>
          </div>

          {/* CARD 6: 100% Private Sanctuary */}
          <div className="group relative rounded-3xl bg-white/10 dark:bg-stone-900/10 backdrop-blur-md border border-white/80 dark:border-stone-800/80 p-7 shadow-lg shadow-stone-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-stone-100/80 dark:bg-stone-800/50 flex items-center justify-center mb-5 border border-stone-200/60 dark:border-stone-700/40 text-stone-700 dark:text-stone-200 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <div className="inline-block text-[11px] font-sans font-medium uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                Safe &amp; Private
              </div>
              <h3 className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-2.5">
                Your Private Space
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                Your thoughts belong only to you. We ensure your reflections remain completely private, secure, and for your eyes only.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-stone-800/60 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
              <span>100% private and secure</span>
            </div>
          </div>

        </div>

        {/* 3-Step Journey Banner */}
        <div className="w-full mt-16 p-8 sm:p-10 rounded-3xl bg-white/10 dark:bg-stone-900/10 backdrop-blur-md border border-white/80 dark:border-stone-800/80 shadow-md">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-serif text-stone-900 dark:text-stone-100 mb-2">
              Your Daily Sanctuary Ritual
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Finding peace takes less than 3 minutes a day
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center text-xs font-serif font-semibold shrink-0">
                1
              </span>
              <div>
                <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Choose your Realm & Breathe
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Select an atmosphere that matches your state of mind and let the gentle wind chimes settle your thoughts.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center text-xs font-serif font-semibold shrink-0">
                2
              </span>
              <div>
                <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Speak or Write Freely
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Record your voice or type your stream of consciousness. No formatting or editing needed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center text-xs font-serif font-semibold shrink-0">
                3
              </span>
              <div>
                <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Receive Compassionate Clarity
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Gemini AI reflects your patterns and provides grounded perspective so you can move forward with peace.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CALL TO ACTION CARD */}
        <div className="w-full mt-12 p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-white/20 to-white/10 dark:from-stone-900/20 dark:to-stone-900/10 backdrop-blur-md border border-white/50 dark:border-stone-700/80 shadow-xl text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 dark:bg-purple-500/10 text-rose-500 dark:text-purple-400 flex items-center justify-center mb-4">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3
            className={`text-2xl sm:text-3xl md:text-4xl font-serif font-light mb-3 ${monumentTheme === 'twilight' ? 'text-white' : 'text-stone-900'
              }`}
          >
            Ready to discover quiet in a noisy world?
          </h3>
          <p className="max-w-xl text-xs sm:text-sm text-stone-600 dark:text-stone-300 mb-8 leading-relaxed">
            Begin your reflective journey today. Your private sanctuary is free, peaceful, and waiting for you.
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative flex items-center gap-3.5 px-8 py-3.5 rounded-full bg-stone-900 hover:bg-black text-white dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium">
              {loading ? 'Opening Sanctuary...' : 'Get Started with Google'}
            </span>
          </button>
        </div>

        {/* Clean Subdued Footer */}
        <footer className="mt-16 text-center text-xs text-stone-500/80 dark:text-stone-400/80 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
          <span>&copy; {new Date().getFullYear()} Gemini Sanctuary &amp; Reflections</span>
          <span className="hidden sm:inline">&bull;</span>
          <span>Private, Isolated &amp; Ad-Free</span>
        </footer>
      </section>
    </div>
  );
};
