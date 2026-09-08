import React from 'react';

interface MonumentValleyCanvasProps {
  interactiveRotation?: number;
  accentColor?: string;
  theme?: 'rose' | 'twilight' | 'sand' | 'teal';
}

const themePalettes = {
  rose: {
    skyTop: '#FFF0F3',
    skyBottom: '#FDE2E4',
    water: '#FCD5CE',
  },
  twilight: {
    skyTop: '#16152B',
    skyBottom: '#282647',
    water: '#1E1D36',
  },
  sand: {
    skyTop: '#FFF5E8',
    skyBottom: '#FFE7CF',
    water: '#FAA08C',
  },
  teal: {
    skyTop: '#EAF3F4',
    skyBottom: '#D4E6D9',
    water: '#9EC2B0',
  },
};

export const MonumentValleyCanvas: React.FC<MonumentValleyCanvasProps> = ({
  theme = 'rose',
}) => {
  const cur = themePalettes[theme] || themePalettes.rose;

  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none transition-colors duration-700 -z-10"
      style={{
        background: `linear-gradient(to bottom, ${cur.skyTop} 0%, ${cur.skyBottom} 65%, ${cur.water} 100%)`,
      }}
    />
  );
};
