import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { monumentSound } from '../lib/monumentSound';

interface MonumentChimeToggleProps {
  muted: boolean;
  onToggleMute: (muted: boolean) => void;
  className?: string;
}

export const MonumentChimeToggle: React.FC<MonumentChimeToggleProps> = ({
  muted,
  onToggleMute,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !muted;
    onToggleMute(next);
    monumentSound.setMuted(next);
    if (!next) {
      monumentSound.playHarmonicResolve();
    }
  };

  return (
    <button
      id="monument-chime-toggle-btn"
      type="button"
      onClick={handleClick}
      aria-label={muted ? 'Enable tactile chimes' : 'Mute tactile chimes'}
      title={muted ? 'Enable tactile chimes' : 'Mute tactile chimes'}
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-all cursor-pointer ${
        muted
          ? 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
          : 'text-stone-700 dark:text-stone-200 hover:text-rose-600 dark:hover:text-rose-300'
      } ${className}`}
    >
      {muted ? (
        <VolumeX className="w-3.5 h-3.5" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
};
