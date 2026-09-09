export type MonumentRealmTheme = 'rose' | 'twilight' | 'sand' | 'teal';

export interface RealmThemeTokens {
  id: MonumentRealmTheme;
  name: string;
  subtitle: string;
  pageBg: string;
  bgGradient: string;
  // Sidebar
  sidebarBg: string;
  sidebarBorder: string;
  sidebarHover: string;
  sidebarActive: string;
  sidebarActiveText: string;
  sidebarInactiveText: string;
  // Cards & Panels
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
  cardActiveBorder: string;
  cardActiveRing: string;
  cardShadow: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  // Buttons
  primaryBtn: string;
  secondaryBtn: string;
  iconBtnHover: string;
  // Badges & Accents
  accentBadge: string;
  accentDot: string;
  accentIconBg: string;
  accentIconBorder: string;
  accentIconColor: string;
  // Inputs & Focus
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  // Pills & Modes
  pillActive: string;
  pillInactive: string;
  // Conversation Bubbles
  userBubble: string;
  geminiBubble: string;
  // Modal Styles
  modalHeaderBg: string;
  modalBodyBg: string;
  modalBorder: string;
  // Chart Colors
  chartGridStroke: string;
  chartAxisStroke: string;
  chartMainStroke: string;
  chartSecondaryStroke: string;
  chartAccentStroke: string;
  chartMutedStroke: string;
}

export const REALM_THEMES: Record<MonumentRealmTheme, RealmThemeTokens> = {
  rose: {
    id: 'rose',
    name: 'Rose Dawn (Taj Mahal)',
    subtitle: 'Mughal marble symmetry, reflecting pool & drifting petals',
    pageBg: '#FDF6F0',
    bgGradient:
      'radial-gradient(at 15% 15%, rgba(253, 226, 228, 0.75) 0px, transparent 55%), radial-gradient(at 85% 10%, rgba(254, 217, 203, 0.65) 0px, transparent 50%), radial-gradient(at 50% 55%, rgba(255, 248, 243, 0.9) 0px, transparent 65%), radial-gradient(at 80% 85%, rgba(246, 203, 217, 0.55) 0px, transparent 50%), radial-gradient(at 20% 90%, rgba(250, 235, 224, 0.7) 0px, transparent 55%)',
    sidebarBg: 'bg-[#FFF8F5]/85 backdrop-blur-2xl',
    sidebarBorder: 'border-rose-200/80',
    sidebarHover: 'hover:bg-rose-100/70 hover:text-rose-950',
    sidebarActive: 'bg-rose-500 text-white shadow-xs shadow-rose-500/30',
    sidebarActiveText: 'text-white',
    sidebarInactiveText: 'text-stone-600',
    cardBg: 'bg-white/70 backdrop-blur-xl',
    cardBorder: 'border-rose-200/75',
    cardBorderHover: 'hover:border-rose-300 hover:bg-white/90',
    cardActiveBorder: 'border-rose-400/90',
    cardActiveRing: 'ring-1 ring-rose-300/80 shadow-md shadow-rose-900/5',
    cardShadow: 'shadow-xs',
    textPrimary: 'text-rose-950',
    textSecondary: 'text-rose-800/80',
    textMuted: 'text-rose-600/70',
    textAccent: 'text-rose-600',
    primaryBtn:
      'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-xs shadow-rose-500/20 border border-white/30',
    secondaryBtn:
      'bg-white/90 hover:bg-rose-50 text-rose-900 border border-rose-200/80 shadow-2xs',
    iconBtnHover: 'hover:bg-rose-100/70 hover:text-rose-900',
    accentBadge: 'bg-rose-100 text-rose-800 border border-rose-300',
    accentDot: 'bg-rose-500',
    accentIconBg: 'bg-rose-100',
    accentIconBorder: 'border-rose-200',
    accentIconColor: 'text-rose-600',
    inputBg: 'bg-white/80',
    inputBorder: 'border-rose-200/90',
    inputFocus: 'focus:outline-hidden focus:border-rose-400 focus:ring-2 focus:ring-rose-300/50',
    pillActive: 'bg-rose-100/90 text-rose-950 border-rose-400 ring-1 ring-rose-300/80 shadow-xs',
    pillInactive: 'bg-white/75 text-rose-900 border-rose-200/70 hover:bg-white hover:border-rose-300',
    userBubble: 'bg-white/95 border border-rose-200/80 text-rose-950 shadow-xs',
    geminiBubble: 'bg-rose-50/80 border border-rose-200/70 text-rose-950 shadow-xs',
    modalHeaderBg: 'bg-rose-50/60 border-b border-rose-200/70',
    modalBodyBg: 'bg-[#FFFDFB]/95',
    modalBorder: 'border-rose-200/80',
    chartGridStroke: '#FFE4E6',
    chartAxisStroke: '#9F1239',
    chartMainStroke: '#F43F5E',
    chartSecondaryStroke: '#FB7185',
    chartAccentStroke: '#E11D48',
    chartMutedStroke: '#FDA4AF',
  },
  sand: {
    id: 'sand',
    name: 'Sand Oasis (Pyramids of Giza)',
    subtitle: 'Ancient Egyptian pyramids, golden mist & ocean waves',
    pageBg: '#FFFDF7',
    bgGradient:
      'radial-gradient(at 15% 15%, rgba(254, 243, 199, 0.75) 0px, transparent 55%), radial-gradient(at 85% 10%, rgba(253, 230, 138, 0.65) 0px, transparent 50%), radial-gradient(at 50% 55%, rgba(255, 251, 235, 0.9) 0px, transparent 65%), radial-gradient(at 80% 85%, rgba(251, 191, 36, 0.3) 0px, transparent 50%), radial-gradient(at 20% 90%, rgba(254, 215, 170, 0.7) 0px, transparent 55%)',
    sidebarBg: 'bg-[#FFFDF5]/85 backdrop-blur-2xl',
    sidebarBorder: 'border-amber-200/80',
    sidebarHover: 'hover:bg-amber-100/70 hover:text-amber-950',
    sidebarActive: 'bg-amber-600 text-white shadow-xs shadow-amber-600/30',
    sidebarActiveText: 'text-white',
    sidebarInactiveText: 'text-stone-600',
    cardBg: 'bg-white/70 backdrop-blur-xl',
    cardBorder: 'border-amber-200/75',
    cardBorderHover: 'hover:border-amber-300 hover:bg-white/90',
    cardActiveBorder: 'border-amber-500/90',
    cardActiveRing: 'ring-1 ring-amber-300/80 shadow-md shadow-amber-900/5',
    cardShadow: 'shadow-xs',
    textPrimary: 'text-amber-950',
    textSecondary: 'text-amber-900/80',
    textMuted: 'text-amber-700/70',
    textAccent: 'text-amber-700',
    primaryBtn:
      'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-xs shadow-amber-600/20 border border-white/30',
    secondaryBtn:
      'bg-white/90 hover:bg-amber-50 text-amber-950 border border-amber-200/80 shadow-2xs',
    iconBtnHover: 'hover:bg-amber-100/70 hover:text-amber-950',
    accentBadge: 'bg-amber-100 text-amber-900 border border-amber-300',
    accentDot: 'bg-amber-500',
    accentIconBg: 'bg-amber-100',
    accentIconBorder: 'border-amber-200',
    accentIconColor: 'text-amber-700',
    inputBg: 'bg-white/80',
    inputBorder: 'border-amber-200/90',
    inputFocus: 'focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-300/50',
    pillActive: 'bg-amber-100/90 text-amber-950 border-amber-500 ring-1 ring-amber-300/80 shadow-xs',
    pillInactive: 'bg-white/75 text-amber-950 border-amber-200/70 hover:bg-white hover:border-amber-300',
    userBubble: 'bg-white/95 border border-amber-200/80 text-amber-950 shadow-xs',
    geminiBubble: 'bg-amber-50/80 border border-amber-200/70 text-amber-950 shadow-xs',
    modalHeaderBg: 'bg-amber-50/60 border-b border-amber-200/70',
    modalBodyBg: 'bg-[#FFFEFB]/95',
    modalBorder: 'border-amber-200/80',
    chartGridStroke: '#FEF3C7',
    chartAxisStroke: '#92400E',
    chartMainStroke: '#D97706',
    chartSecondaryStroke: '#F59E0B',
    chartAccentStroke: '#B45309',
    chartMutedStroke: '#FCD34D',
  },
  teal: {
    id: 'teal',
    name: 'Teal Sanctuary (Badshahi Mosque)',
    subtitle: 'Triple marble domes, grand minarets & tranquil courtyard',
    pageBg: '#F2FAF8',
    bgGradient:
      'radial-gradient(at 15% 15%, rgba(204, 251, 241, 0.75) 0px, transparent 55%), radial-gradient(at 85% 10%, rgba(167, 243, 208, 0.65) 0px, transparent 50%), radial-gradient(at 50% 55%, rgba(240, 253, 250, 0.9) 0px, transparent 65%), radial-gradient(at 80% 85%, rgba(153, 246, 228, 0.35) 0px, transparent 50%), radial-gradient(at 20% 90%, rgba(209, 250, 229, 0.7) 0px, transparent 55%)',
    sidebarBg: 'bg-[#F2FAF7]/85 backdrop-blur-2xl',
    sidebarBorder: 'border-teal-200/80',
    sidebarHover: 'hover:bg-teal-100/70 hover:text-teal-950',
    sidebarActive: 'bg-teal-600 text-white shadow-xs shadow-teal-600/30',
    sidebarActiveText: 'text-white',
    sidebarInactiveText: 'text-stone-600',
    cardBg: 'bg-white/70 backdrop-blur-xl',
    cardBorder: 'border-teal-200/75',
    cardBorderHover: 'hover:border-teal-300 hover:bg-white/90',
    cardActiveBorder: 'border-teal-500/90',
    cardActiveRing: 'ring-1 ring-teal-300/80 shadow-md shadow-teal-900/5',
    cardShadow: 'shadow-xs',
    textPrimary: 'text-teal-950',
    textSecondary: 'text-teal-900/80',
    textMuted: 'text-teal-700/70',
    textAccent: 'text-teal-700',
    primaryBtn:
      'bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white shadow-xs shadow-teal-600/20 border border-white/30',
    secondaryBtn:
      'bg-white/90 hover:bg-teal-50 text-teal-950 border border-teal-200/80 shadow-2xs',
    iconBtnHover: 'hover:bg-teal-100/70 hover:text-teal-950',
    accentBadge: 'bg-teal-100 text-teal-900 border border-teal-300',
    accentDot: 'bg-teal-500',
    accentIconBg: 'bg-teal-100',
    accentIconBorder: 'border-teal-200',
    accentIconColor: 'text-teal-700',
    inputBg: 'bg-white/80',
    inputBorder: 'border-teal-200/90',
    inputFocus: 'focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-300/50',
    pillActive: 'bg-teal-100/90 text-teal-950 border-teal-500 ring-1 ring-teal-300/80 shadow-xs',
    pillInactive: 'bg-white/75 text-teal-950 border-teal-200/70 hover:bg-white hover:border-teal-300',
    userBubble: 'bg-white/95 border border-teal-200/80 text-teal-950 shadow-xs',
    geminiBubble: 'bg-teal-50/80 border border-teal-200/70 text-teal-950 shadow-xs',
    modalHeaderBg: 'bg-teal-50/60 border-b border-teal-200/70',
    modalBodyBg: 'bg-[#F9FCFA]/95',
    modalBorder: 'border-teal-200/80',
    chartGridStroke: '#CCFBF1',
    chartAxisStroke: '#115E59',
    chartMainStroke: '#0D9488',
    chartSecondaryStroke: '#14B8A6',
    chartAccentStroke: '#0F766E',
    chartMutedStroke: '#5EEAD4',
  },
  twilight: {
    id: 'twilight',
    name: 'Twilight Sky (Van Fortress)',
    subtitle: 'Ancient rock citadel of Tushpa, starry night & comets',
    pageBg: '#F6F6FD',
    bgGradient:
      'radial-gradient(at 15% 15%, rgba(224, 231, 255, 0.75) 0px, transparent 55%), radial-gradient(at 85% 10%, rgba(237, 233, 254, 0.65) 0px, transparent 50%), radial-gradient(at 50% 55%, rgba(248, 250, 252, 0.9) 0px, transparent 65%), radial-gradient(at 80% 85%, rgba(199, 210, 254, 0.35) 0px, transparent 50%), radial-gradient(at 20% 90%, rgba(224, 231, 255, 0.7) 0px, transparent 55%)',
    sidebarBg: 'bg-[#F5F5FC]/85 backdrop-blur-2xl',
    sidebarBorder: 'border-indigo-200/80',
    sidebarHover: 'hover:bg-indigo-100/70 hover:text-indigo-950',
    sidebarActive: 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30',
    sidebarActiveText: 'text-white',
    sidebarInactiveText: 'text-stone-600',
    cardBg: 'bg-white/70 backdrop-blur-xl',
    cardBorder: 'border-indigo-200/75',
    cardBorderHover: 'hover:border-indigo-300 hover:bg-white/90',
    cardActiveBorder: 'border-indigo-400/90',
    cardActiveRing: 'ring-1 ring-indigo-300/80 shadow-md shadow-indigo-900/5',
    cardShadow: 'shadow-xs',
    textPrimary: 'text-indigo-950',
    textSecondary: 'text-indigo-900/80',
    textMuted: 'text-indigo-700/70',
    textAccent: 'text-indigo-600',
    primaryBtn:
      'bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white shadow-xs shadow-indigo-600/20 border border-white/30',
    secondaryBtn:
      'bg-white/90 hover:bg-indigo-50 text-indigo-950 border border-indigo-200/80 shadow-2xs',
    iconBtnHover: 'hover:bg-indigo-100/70 hover:text-indigo-950',
    accentBadge: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
    accentDot: 'bg-indigo-500',
    accentIconBg: 'bg-indigo-100',
    accentIconBorder: 'border-indigo-200',
    accentIconColor: 'text-indigo-600',
    inputBg: 'bg-white/80',
    inputBorder: 'border-indigo-200/90',
    inputFocus: 'focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300/50',
    pillActive: 'bg-indigo-100/90 text-indigo-950 border-indigo-400 ring-1 ring-indigo-300/80 shadow-xs',
    pillInactive: 'bg-white/75 text-indigo-950 border-indigo-200/70 hover:bg-white hover:border-indigo-300',
    userBubble: 'bg-white/95 border border-indigo-200/80 text-indigo-950 shadow-xs',
    geminiBubble: 'bg-indigo-50/80 border border-indigo-200/70 text-indigo-950 shadow-xs',
    modalHeaderBg: 'bg-indigo-50/60 border-b border-indigo-200/70',
    modalBodyBg: 'bg-[#FBFCFE]/95',
    modalBorder: 'border-indigo-200/80',
    chartGridStroke: '#E0E7FF',
    chartAxisStroke: '#3730A3',
    chartMainStroke: '#4F46E5',
    chartSecondaryStroke: '#6366F1',
    chartAccentStroke: '#4338CA',
    chartMutedStroke: '#818CF8',
  },
};

export const getRealmTheme = (theme: MonumentRealmTheme = 'sand'): RealmThemeTokens => {
  return REALM_THEMES[theme] || REALM_THEMES['sand'];
};
