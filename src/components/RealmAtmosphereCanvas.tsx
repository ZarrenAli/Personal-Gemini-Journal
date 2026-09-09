import React, { useEffect, useRef } from 'react';
import { MonumentRealmTheme } from '../lib/realmTheme';

interface RealmAtmosphereCanvasProps {
  theme?: MonumentRealmTheme;
}

interface PetalParticle {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  orbitAngle: number;
  orbitSpeed: number;
  driftX: number;
  driftY: number;
  flutterPhase: number;
  flutterSpeed: number;
  flutterAmp: number;
  tiltAngle: number; // Tilted plane for the whirlwind
  variant: number; // 0: Broad Cupped Shell, 1: Asymmetric Scoop, 2: Perspective Bowl
  palette: {
    body: string;
    deep: string;
    rim: string;
    base: string;
  };
}

interface RoseGlowParticle {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  orbitAngle: number;
  orbitSpeed: number;
  driftX: number;
  driftY: number;
  size: number;
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  color: string;
}

interface LeafParticle {
  x: number;
  y: number;
  size: number;
  progress: number; // 0.0 to 1.0 along the wind gust path
  speed: number;
  rowOffsetY: number;
  swirlRadiusOffset: number;
  swirlPhaseOffset: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  type: 'ginkgo' | 'willow' | 'laurel';
  color: string;
  opacity: number;
  flutterPhase: number;
  flutterSpeed: number;
  flutterAmp: number;
}

interface TealSporeParticle {
  progress: number;
  speed: number;
  rowOffsetY: number;
  swirlRadiusOffset: number;
  swirlPhaseOffset: number;
  size: number;
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  color: string;
}

interface StarParticle {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  isCross: boolean;
}

interface CometParticle {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  thickness: number;
  color: string;
  life: number;
  maxLife: number;
}

interface WaveFoamParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
  decay: number;
}

interface SandDustParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
  phase: number;
  color: string;
}

export const RealmAtmosphereCanvas: React.FC<RealmAtmosphereCanvasProps> = ({
  theme = 'rose',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // --- 1. ROSE REALM: Monument Valley Stylized Silky Rose Petals (Matching reference photo) ---
    const monumentRosePalettes = [
      { body: '#F9A8D4', fold: '#FFF0F5', shade: '#F472B6', base: '#FEF3C7' }, // Silky Sakura Pink & Pearl Fold
      { body: '#F472B6', fold: '#FFF5F7', shade: '#FB7185', base: '#FFFBEB' }, // Warm Blossom Pink & Ivory Fold
      { body: '#FBCFE8', fold: '#FFFFFF', shade: '#F472B6', base: '#FEF9C3' }, // Luminous Pale Rose & White Fold
      { body: '#FDA4AF', fold: '#FFF1F2', shade: '#F43F5E', base: '#FEF08A' }, // Soft Peach Rose & Cream Fold
      { body: '#F472B6', fold: '#FDE2E4', shade: '#E11D48', base: '#FFF8E7' }, // Ethereal Rose Quartz Fold
    ];
    const PETAL_COUNT = Math.min(42, Math.floor(window.innerWidth / 32));
    const petals: PetalParticle[] = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
      const isLarge = Math.random() > 0.45;
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: isLarge ? Math.random() * 6 + 16 : Math.random() * 4 + 11.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.014,
        flip: Math.random() * Math.PI * 2,
        flipSpeed: Math.random() * 0.02 + 0.008,
        opacity: Math.random() * 0.22 + 0.76,
        centerX: Math.random() * (width + 200) - 100,
        centerY: Math.random() * (height + 200) - 100,
        radiusX: Math.random() * 180 + 70,
        radiusY: Math.random() * 80 + 35,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: (Math.random() * 0.008 + 0.004) * (Math.random() > 0.3 ? 1 : -0.9),
        driftX: Math.random() * 0.36 + 0.16,
        driftY: (Math.random() - 0.4) * 0.18 + 0.08,
        flutterPhase: Math.random() * Math.PI * 2,
        flutterSpeed: Math.random() * 0.024 + 0.012,
        flutterAmp: Math.random() * 14 + 6,
        tiltAngle: (Math.random() - 0.5) * 0.5 - 0.18,
        variant: i % 3,
        palette: {
          body: monumentRosePalettes[i % monumentRosePalettes.length].body,
          deep: monumentRosePalettes[i % monumentRosePalettes.length].shade,
          rim: monumentRosePalettes[i % monumentRosePalettes.length].fold,
          base: monumentRosePalettes[i % monumentRosePalettes.length].base,
        },
      });
    }

    const ROSE_GLOW_COUNT = 24;
    const roseGlows: RoseGlowParticle[] = [];
    const glowColors = ['rgba(255, 235, 240, 0.7)', 'rgba(254, 205, 211, 0.6)', 'rgba(253, 230, 138, 0.6)'];
    for (let i = 0; i < ROSE_GLOW_COUNT; i++) {
      roseGlows.push({
        centerX: Math.random() * (width + 200) - 100,
        centerY: Math.random() * (height + 200) - 100,
        radiusX: Math.random() * 160 + 50,
        radiusY: Math.random() * 70 + 25,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: Math.random() * 0.009 + 0.005,
        driftX: Math.random() * 0.35 + 0.15,
        driftY: (Math.random() - 0.5) * 0.15 + 0.06,
        size: Math.random() * 2.2 + 1.2,
        alpha: Math.random() * 0.5 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        color: glowColors[Math.floor(Math.random() * glowColors.length)],
      });
    }

    // --- 2. TEAL REALM: Flowing Wind Gust of Sacred Leaves & Forest Spores ---
    const leafColors = [
      'rgba(167, 243, 208, 0.80)', // Pale Mint
      'rgba(110, 231, 183, 0.75)', // Emerald Sage
      'rgba(52, 211, 153, 0.70)',  // Rich Jade
      'rgba(164, 195, 178, 0.80)', // Soft Muted Forest
      'rgba(204, 227, 222, 0.75)', // Translucent Dew
      'rgba(5, 150, 105, 0.65)',   // Deep Sacred Grove
    ];
    // Clean, sparse leaf count (12 leaves) matching the reference wind drawing
    const LEAF_COUNT = 12;
    const leaves: LeafParticle[] = [];
    const leafTypes: ('ginkgo' | 'willow' | 'laurel')[] = ['ginkgo', 'willow', 'laurel'];
    for (let i = 0; i < LEAF_COUNT; i++) {
      // Evenly spaced progress along the wind path for a clean, uncluttered flow
      const baseProgress = (i / LEAF_COUNT) + (Math.random() - 0.5) * 0.04;
      leaves.push({
        x: -150,
        y: height * 0.48,
        size: Math.random() * 5 + 13,
        progress: baseProgress,
        speed: Math.random() * 0.0003 + 0.0016,
        rowOffsetY: (Math.random() - 0.5) * 120,
        swirlRadiusOffset: (Math.random() - 0.5) * 35,
        swirlPhaseOffset: (Math.random() - 0.5) * 0.35,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.016,
        flip: Math.random() * Math.PI * 2,
        flipSpeed: Math.random() * 0.02 + 0.008,
        type: leafTypes[i % leafTypes.length],
        color: leafColors[i % leafColors.length],
        opacity: Math.random() * 0.25 + 0.70,
        flutterPhase: Math.random() * Math.PI * 2,
        flutterSpeed: Math.random() * 0.025 + 0.01,
        flutterAmp: Math.random() * 10 + 5,
      });
    }

    const TEAL_SPORE_COUNT = 10;
    const tealSpores: TealSporeParticle[] = [];
    const sporeColors = ['rgba(167, 243, 208, 0.7)', 'rgba(110, 231, 183, 0.65)', 'rgba(255, 255, 255, 0.8)'];
    for (let i = 0; i < TEAL_SPORE_COUNT; i++) {
      tealSpores.push({
        progress: (i / TEAL_SPORE_COUNT) + (Math.random() - 0.5) * 0.05,
        speed: Math.random() * 0.0003 + 0.0017,
        rowOffsetY: (Math.random() - 0.5) * 90,
        swirlRadiusOffset: (Math.random() - 0.5) * 35,
        swirlPhaseOffset: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.0 + 1.0,
        alpha: Math.random() * 0.4 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        color: sporeColors[i % sporeColors.length],
      });
    }

    // --- 3. TWILIGHT REALM: Starry Night & Falling Comets ---
    const STAR_COUNT = Math.min(100, Math.floor(window.innerWidth / 14));
    const stars: StarParticle[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.85,
        size: Math.random() * 1.8 + 0.7,
        baseAlpha: Math.random() * 0.5 + 0.25,
        twinkleSpeed: Math.random() * 0.03 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        isCross: Math.random() > 0.82,
      });
    }

    const comets: CometParticle[] = [];
    let cometTimer = 0;

    const spawnComet = () => {
      const angle = (Math.random() * 25 + 125) * (Math.PI / 180); // Diagonal downward streak
      const startX = Math.random() * (width * 0.8) + width * 0.2;
      const startY = Math.random() * (height * 0.3);
      comets.push({
        x: startX,
        y: startY,
        length: Math.random() * 120 + 80,
        speed: Math.random() * 6 + 4.5,
        angle,
        alpha: 1.0,
        thickness: Math.random() * 2 + 1.2,
        color: Math.random() > 0.4 ? '#E0E7FF' : '#DDD6FE',
        life: 0,
        maxLife: Math.random() * 60 + 45,
      });
    };

    // Initial shooting star on load
    if (theme === 'twilight') {
      spawnComet();
    }

    // --- 4. SAND REALM: Ocean Waves hitting Shore + Golden Sand Mist ---
    const FOAM_COUNT = 36;
    const foamParticles: WaveFoamParticle[] = [];
    for (let i = 0; i < FOAM_COUNT; i++) {
      foamParticles.push({
        x: Math.random() * width,
        y: height * 0.72 + Math.random() * (height * 0.28),
        size: Math.random() * 3.5 + 1.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.2,
        decay: Math.random() * 0.005 + 0.002,
      });
    }

    const DUST_COUNT = Math.min(32, Math.floor(window.innerWidth / 40));
    const sandDust: SandDustParticle[] = [];
    const sandColors = ['rgba(254, 243, 199, 0.45)', 'rgba(253, 230, 138, 0.35)', 'rgba(251, 191, 36, 0.25)', 'rgba(255, 255, 255, 0.5)'];
    for (let i = 0; i < DUST_COUNT; i++) {
      sandDust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        speedX: Math.random() * 0.35 + 0.1,
        speedY: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.45 + 0.2,
        phase: Math.random() * Math.PI * 2,
        color: sandColors[Math.floor(Math.random() * sandColors.length)],
      });
    }

    // --- Draw Functions ---

    // 1. Draw Monument Valley Stylized Silky Rose Petals (Matching reference photo)
    const drawPetal = (p: PetalParticle, scaleFactor: number = 1.0, alphaFactor: number = 1.0) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      const flipX = Math.cos(p.flip);
      const flipY = Math.sin(p.flip * 0.75);
      // Realistic 3D wind tumbling with clean isometric presence
      ctx.scale(flipX * scaleFactor, Math.max(0.3, Math.abs(flipY)) * scaleFactor);
      ctx.globalAlpha = Math.min(1.0, Math.max(0.12, p.opacity * alphaFactor));

      const w = p.size * 1.1;
      const h = p.size * 1.15;
      const pal = p.palette;

      if (p.variant === 0) {
        // --- Variant 0: Broad Silky Fan Petal with Top Folded Highlight (like central petals in reference photo) ---
        // Main Silky Body Gradient
        const bodyGrad = ctx.createLinearGradient(0, h * 0.8, 0, -h * 0.7);
        bodyGrad.addColorStop(0, pal.base); // Soft cream base
        bodyGrad.addColorStop(0.2, pal.body); // Silky pink body
        bodyGrad.addColorStop(1, pal.deep); // Delicate rose tone

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.85); // Base point
        ctx.bezierCurveTo(w * 0.85, h * 0.6, w * 1.1, 0, w * 0.85, -h * 0.55);
        ctx.bezierCurveTo(w * 0.55, -h * 0.88, -w * 0.55, -h * 0.88, -w * 0.85, -h * 0.55);
        ctx.bezierCurveTo(-w * 1.1, 0, -w * 0.85, h * 0.6, 0, h * 0.85);
        ctx.closePath();
        ctx.fill();

        // Monument Valley Stylized Folded Lip Facet (Top light catching curled rim)
        ctx.beginPath();
        ctx.moveTo(-w * 0.85, -h * 0.55);
        ctx.bezierCurveTo(-w * 0.5, -h * 0.88, w * 0.5, -h * 0.88, w * 0.85, -h * 0.55);
        ctx.bezierCurveTo(w * 0.45, -h * 0.65, -w * 0.45, -h * 0.65, -w * 0.85, -h * 0.55);
        ctx.closePath();
        ctx.fillStyle = pal.rim; // Luminous pearl/cream folded facet
        ctx.globalAlpha = Math.min(1.0, p.opacity * alphaFactor * 0.88);
        ctx.fill();

        // Delicate pale base attachment glow
        ctx.beginPath();
        ctx.arc(0, h * 0.82, p.size * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = pal.base;
        ctx.globalAlpha = Math.min(1.0, p.opacity * alphaFactor * 0.95);
        ctx.fill();

      } else if (p.variant === 1) {
        // --- Variant 1: Gently Curled Flap Petal (like top-left/top-right folded petals in photo) ---
        const flapGrad = ctx.createLinearGradient(-w * 0.7, h * 0.6, w * 0.7, -h * 0.7);
        flapGrad.addColorStop(0, pal.base);
        flapGrad.addColorStop(0.3, pal.body);
        flapGrad.addColorStop(1, pal.deep);

        ctx.fillStyle = flapGrad;
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, h * 0.75); // Base
        ctx.bezierCurveTo(w * 0.5, h * 0.8, w * 1.05, h * 0.2, w * 0.85, -h * 0.35);
        ctx.bezierCurveTo(w * 0.55, -h * 0.85, -w * 0.25, -h * 0.88, -w * 0.75, -h * 0.45);
        ctx.bezierCurveTo(-w * 1.0, 0, -w * 0.8, h * 0.45, -w * 0.35, h * 0.75);
        ctx.closePath();
        ctx.fill();

        // Folded Side-Flap Plane (Isometric/Monument Valley Lighting)
        ctx.beginPath();
        ctx.moveTo(-w * 0.75, -h * 0.45);
        ctx.bezierCurveTo(-w * 0.25, -h * 0.88, w * 0.55, -h * 0.85, w * 0.85, -h * 0.35);
        ctx.bezierCurveTo(w * 0.4, -h * 0.45, -w * 0.2, -h * 0.5, -w * 0.75, -h * 0.45);
        ctx.closePath();
        ctx.fillStyle = pal.rim; // Crisp light facet
        ctx.globalAlpha = Math.min(1.0, p.opacity * alphaFactor * 0.9);
        ctx.fill();

        // Pale base dot
        ctx.beginPath();
        ctx.arc(-w * 0.35, h * 0.75, p.size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = pal.base;
        ctx.globalAlpha = Math.min(1.0, p.opacity * alphaFactor * 0.95);
        ctx.fill();

      } else {
        // --- Variant 2: Slender Curved Blossom Petal (like bottom-right in photo) ---
        const scoopGrad = ctx.createRadialGradient(w * 0.1, -h * 0.1, w * 0.05, 0, h * 0.1, w * 1.1);
        scoopGrad.addColorStop(0, pal.deep);
        scoopGrad.addColorStop(0.5, pal.body);
        scoopGrad.addColorStop(1, pal.rim);

        ctx.fillStyle = scoopGrad;
        ctx.beginPath();
        ctx.moveTo(-w * 0.55, h * 0.65);
        ctx.bezierCurveTo(-w * 0.9, h * 0.15, -w * 0.8, -h * 0.45, -w * 0.15, -h * 0.75);
        ctx.bezierCurveTo(w * 0.45, -h * 0.82, w * 0.95, -h * 0.4, w * 0.8, -h * 0.15);
        ctx.bezierCurveTo(w * 0.7, h * 0.4, w * 0.15, h * 0.85, -w * 0.55, h * 0.65);
        ctx.closePath();
        ctx.fill();

        // Luminous Upper Rim Edge
        ctx.beginPath();
        ctx.moveTo(-w * 0.65, -h * 0.35);
        ctx.bezierCurveTo(-w * 0.15, -h * 0.75, w * 0.45, -h * 0.82, w * 0.8, -h * 0.15);
        ctx.bezierCurveTo(w * 0.4, -h * 0.6, -w * 0.1, -h * 0.55, -w * 0.65, -h * 0.35);
        ctx.closePath();
        ctx.fillStyle = pal.rim;
        ctx.globalAlpha = Math.min(1.0, p.opacity * alphaFactor * 0.85);
        ctx.fill();

        // Base dot
        ctx.beginPath();
        ctx.arc(w * 0.8, -h * 0.15, p.size * 0.14, 0, Math.PI * 2);
        ctx.fillStyle = pal.base;
        ctx.globalAlpha = Math.min(1.0, p.opacity * alphaFactor * 0.95);
        ctx.fill();
      }

      ctx.restore();
    };

    const drawRoseGlow = (g: RoseGlowParticle, x: number, y: number, alphaFactor: number = 1.0) => {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, Math.max(0, g.alpha * alphaFactor));
      ctx.fillStyle = g.color;
      ctx.shadowColor = 'rgba(255, 200, 220, 0.8)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, y, g.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // 2. Draw Foliage / Sacred Leaves with 3D Depth & Flow Rotation
    const drawLeaf = (
      l: LeafParticle,
      scaleFactor: number = 1.0,
      alphaFactor: number = 1.0,
      dynamicRotation?: number
    ) => {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(dynamicRotation !== undefined ? dynamicRotation : l.rotation);
      ctx.scale(Math.cos(l.flip) * scaleFactor, scaleFactor); // 3D wind flip and scale
      ctx.fillStyle = l.color;
      ctx.globalAlpha = Math.min(1.0, Math.max(0, l.opacity * alphaFactor));

      if (l.type === 'ginkgo') {
        // Fan-shaped ginkgo leaf
        ctx.beginPath();
        ctx.moveTo(0, l.size * 0.6);
        ctx.bezierCurveTo(l.size * 0.8, 0, l.size * 0.9, -l.size * 0.7, l.size * 0.2, -l.size);
        ctx.lineTo(0, -l.size * 0.75); // Notch
        ctx.lineTo(-l.size * 0.2, -l.size);
        ctx.bezierCurveTo(-l.size * 0.9, -l.size * 0.7, -l.size * 0.8, 0, 0, l.size * 0.6);
        ctx.closePath();
        ctx.fill();

        // Stem
        ctx.beginPath();
        ctx.moveTo(0, l.size * 0.6);
        ctx.lineTo(0, l.size * 0.95);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else if (l.type === 'willow') {
        // Slender curved willow leaf
        ctx.beginPath();
        ctx.moveTo(0, -l.size * 1.3);
        ctx.quadraticCurveTo(l.size * 0.35, 0, 0, l.size * 1.3);
        ctx.quadraticCurveTo(-l.size * 0.25, 0, 0, -l.size * 1.3);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, -l.size * 1.1);
        ctx.lineTo(0, l.size * 1.1);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 0.65;
        ctx.stroke();
      } else {
        // Broad oval laurel leaf
        ctx.beginPath();
        ctx.moveTo(0, -l.size);
        ctx.bezierCurveTo(l.size * 0.6, -l.size * 0.4, l.size * 0.6, l.size * 0.4, 0, l.size);
        ctx.bezierCurveTo(-l.size * 0.6, l.size * 0.4, -l.size * 0.6, -l.size * 0.4, 0, -l.size);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, -l.size * 0.8);
        ctx.lineTo(0, l.size * 0.8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawTealSpore = (s: TealSporeParticle, x: number, y: number, alphaFactor: number = 1.0) => {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, Math.max(0, s.alpha * alphaFactor));
      ctx.fillStyle = s.color;
      ctx.shadowColor = 'rgba(110, 231, 183, 0.75)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // --- Monument Valley Hanging Forest Boughs for Teal Realm ---
    const drawHangingTealBranches = (timeVal: number) => {
      const sway1 = Math.sin(timeVal * 0.0009) * 0.038;
      const sway2 = Math.cos(timeVal * 0.0007) * 0.032;
      const branchScale = Math.min(1.18, Math.max(0.62, width / 850));

      const drawLeafNode = (
        x: number,
        y: number,
        angle: number,
        size: number,
        type: 'ginkgo' | 'willow' | 'laurel',
        color: string
      ) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.88;

        if (type === 'ginkgo') {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(size * 0.6, -size * 0.4, size * 0.9, -size * 0.8, size * 0.2, -size);
          ctx.lineTo(0, -size * 0.8);
          ctx.lineTo(-size * 0.2, -size);
          ctx.bezierCurveTo(-size * 0.9, -size * 0.8, -size * 0.6, -size * 0.4, 0, 0);
          ctx.closePath();
          ctx.fill();

          // Soft light highlight facet (Monument Valley dual-tone lighting)
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(size * 0.6, -size * 0.4, size * 0.9, -size * 0.8, size * 0.2, -size);
          ctx.lineTo(0, -size * 0.8);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fill();
        } else if (type === 'willow') {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(size * 0.35, size * 0.6, 0, size * 1.3);
          ctx.quadraticCurveTo(-size * 0.25, size * 0.6, 0, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(size * 0.5, size * 0.3, size * 0.5, size * 0.7, 0, size * 1.0);
          ctx.bezierCurveTo(-size * 0.5, size * 0.7, -size * 0.5, size * 0.3, 0, 0);
          ctx.closePath();
          ctx.fill();
        }

        // Golden dew bud at the node
        ctx.beginPath();
        ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FEF08A';
        ctx.fill();

        ctx.restore();
      };

      // 1. Top-Left Primary Bough (Extended graceful arch)
      ctx.save();
      ctx.translate(0, 0);
      ctx.scale(branchScale, branchScale);
      ctx.rotate(sway1);

      // Main Arching Wood Stem
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.bezierCurveTo(60, 40, 130, 105, 240, 180);
      ctx.strokeStyle = '#2D4A43';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Twig 1 (Early Droop)
      ctx.beginPath();
      ctx.moveTo(50, 42);
      ctx.quadraticCurveTo(65, 80, 60, 120);
      ctx.strokeStyle = '#36584F';
      ctx.lineWidth = 1.7;
      ctx.stroke();
      drawLeafNode(60, 120, 0.3 + sway1, 14, 'willow', '#6EE7B7');
      drawLeafNode(56, 95, -0.6, 13, 'ginkgo', '#A7F3D0');
      drawLeafNode(64, 70, 0.7, 11, 'laurel', '#34D399');

      // Twig 2 (Mid-branch cascading bough)
      ctx.beginPath();
      ctx.moveTo(115, 95);
      ctx.quadraticCurveTo(145, 145, 155, 205);
      ctx.strokeStyle = '#36584F';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      drawLeafNode(155, 205, 0.2 + sway1, 16, 'ginkgo', '#A7F3D0');
      drawLeafNode(148, 168, -0.5, 14, 'willow', '#6EE7B7');
      drawLeafNode(132, 128, 0.8, 12, 'laurel', '#059669');

      // Twig 3 (Extended Mid-Low Twig)
      ctx.beginPath();
      ctx.moveTo(180, 142);
      ctx.quadraticCurveTo(215, 185, 235, 230);
      ctx.strokeStyle = '#36584F';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      drawLeafNode(235, 230, 0.3 + sway1, 14, 'willow', '#A7F3D0');
      drawLeafNode(210, 192, -0.4, 13, 'ginkgo', '#34D399');
      drawLeafNode(192, 160, 0.5, 11, 'laurel', '#059669');

      // Twig 4 (Extended Tip)
      ctx.beginPath();
      ctx.moveTo(215, 165);
      ctx.quadraticCurveTo(255, 205, 285, 220);
      ctx.strokeStyle = '#36584F';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      drawLeafNode(285, 220, 0.4 + sway1, 15, 'willow', '#A7F3D0');
      drawLeafNode(252, 190, -0.3, 14, 'ginkgo', '#34D399');
      drawLeafNode(228, 172, 0.6, 12, 'ginkgo', '#6EE7B7');

      ctx.restore();

      // 2. Top-Left Secondary Droop Bough (Extended)
      ctx.save();
      ctx.translate(145 * branchScale, -5);
      ctx.scale(branchScale, branchScale);
      ctx.rotate(sway2 * 1.1);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(35, 60, 42, 130);
      ctx.strokeStyle = '#36584F';
      ctx.lineWidth = 1.7;
      ctx.stroke();
      drawLeafNode(42, 130, 0.1 + sway2, 14, 'willow', '#6EE7B7');
      drawLeafNode(36, 92, -0.5, 13, 'ginkgo', '#A7F3D0');
      drawLeafNode(22, 50, 0.7, 11, 'laurel', '#059669');

      ctx.restore();

      // 3. Top-Right Extended Framing Bough
      ctx.save();
      ctx.translate(width + 10, -5);
      ctx.scale(branchScale, branchScale);
      ctx.rotate(-sway2 * 0.9);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-70, 45, -150, 95, -230, 160);
      ctx.strokeStyle = '#2D4A43';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Twig Right 1 (Mid Droop)
      ctx.beginPath();
      ctx.moveTo(-75, 50);
      ctx.quadraticCurveTo(-100, 95, -110, 140);
      ctx.strokeStyle = '#36584F';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawLeafNode(-110, 140, -0.3 - sway2, 15, 'ginkgo', '#A7F3D0');
      drawLeafNode(-95, 98, 0.5, 13, 'willow', '#6EE7B7');
      drawLeafNode(-82, 68, -0.6, 11, 'laurel', '#34D399');

      // Twig Right 2 (Extended Mid-Low Twig)
      ctx.beginPath();
      ctx.moveTo(-155, 108);
      ctx.quadraticCurveTo(-195, 150, -215, 190);
      ctx.strokeStyle = '#36584F';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      drawLeafNode(-215, 190, -0.3 - sway2, 14, 'willow', '#A7F3D0');
      drawLeafNode(-188, 152, 0.4, 13, 'ginkgo', '#34D399');

      // Twig Right 3 (Extended Tip)
      ctx.beginPath();
      ctx.moveTo(-200, 140);
      ctx.quadraticCurveTo(-245, 175, -275, 195);
      ctx.strokeStyle = '#36584F';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      drawLeafNode(-275, 195, -0.4 - sway2, 15, 'willow', '#A7F3D0');
      drawLeafNode(-248, 170, 0.3, 14, 'ginkgo', '#34D399');
      drawLeafNode(-218, 145, -0.6, 12, 'laurel', '#059669');

      ctx.restore();
    };

    // --- Monument Valley Boat for Sand Realm ---
    let boatX = width * 0.35;
    const drawMonumentBoat = (bx: number, by: number, pitch: number) => {
      ctx.save();
      ctx.translate(bx, by - 6);
      ctx.rotate(pitch);

      // 1. Water Ripple / Wake beneath hull
      ctx.beginPath();
      ctx.ellipse(0, 8, 30, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      // 2. Geometric Wooden Hull (Faceted Monument Valley Shading)
      // Left / Shaded Stern Facet
      ctx.beginPath();
      ctx.moveTo(-28, -2);
      ctx.lineTo(-14, 8);
      ctx.lineTo(0, 9);
      ctx.lineTo(0, -2);
      ctx.closePath();
      ctx.fillStyle = '#C2410C'; // Warm Terracotta Umber
      ctx.fill();

      // Right / Sunlit Bow Facet
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(0, 9);
      ctx.lineTo(20, 7);
      ctx.lineTo(34, -4);
      ctx.lineTo(16, -2);
      ctx.closePath();
      ctx.fillStyle = '#EA580C'; // Luminous Amber Terracotta
      ctx.fill();

      // Hull Top Deck Rim
      ctx.beginPath();
      ctx.moveTo(-28, -2);
      ctx.lineTo(0, -4);
      ctx.lineTo(34, -4);
      ctx.lineTo(16, -1.5);
      ctx.lineTo(-28, -2);
      ctx.closePath();
      ctx.fillStyle = '#FFF8E7'; // Sandstone Ivory Deck
      ctx.fill();

      // 3. Minimalist Mast
      ctx.beginPath();
      ctx.moveTo(2, -3);
      ctx.lineTo(2, -36);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // 4. Origami Sail (Dual Facet: Sunlit & Shaded)
      // Main Sail (Sunlit Ivory White)
      ctx.beginPath();
      ctx.moveTo(2, -34);
      ctx.lineTo(22, -8);
      ctx.lineTo(2, -8);
      ctx.closePath();
      ctx.fillStyle = '#FFFDF7';
      ctx.fill();

      // Inner Sail Fold Shadow (Warm Gold)
      ctx.beginPath();
      ctx.moveTo(2, -34);
      ctx.lineTo(10, -8);
      ctx.lineTo(2, -8);
      ctx.closePath();
      ctx.fillStyle = '#FDE68A';
      ctx.fill();

      // Jib / Back Sail (Soft Dawn Pink)
      ctx.beginPath();
      ctx.moveTo(1, -30);
      ctx.lineTo(-14, -8);
      ctx.lineTo(1, -8);
      ctx.closePath();
      ctx.fillStyle = '#FEE2E2';
      ctx.fill();

      // 5. Iconic Monument Valley Traveler Figure (Ida / White Hooded Silhouette)
      // Traveler Body (White Conical Robe)
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(-10, -12);
      ctx.lineTo(-2, -12);
      ctx.lineTo(2, -2);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Traveler Conical Cap / Hood (Pointed Hat)
      ctx.beginPath();
      ctx.moveTo(-9, -12);
      ctx.lineTo(-6, -21);
      ctx.lineTo(-3, -12);
      ctx.closePath();
      ctx.fillStyle = '#FFFBEB';
      ctx.fill();

      // 6. Mast Lantern / Golden Beacon Glow
      ctx.beginPath();
      ctx.arc(2, -36, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FBBF24';
      ctx.fill();

      // Lantern Ambient Aura
      ctx.beginPath();
      ctx.arc(2, -36, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.fill();

      ctx.restore();
    };

    // 3. Draw Rolling Shoreline Ocean Waves with Monument Valley Boat for Sand Realm
    let waveTime = 0;
    const drawOceanWaves = (delta: number) => {
      waveTime += 0.015 * delta;
      const baseWaveY = height * 0.52;

      // Slowly drift the boat across the water horizon
      boatX += 0.28 * delta;
      if (boatX > width + 80) {
        boatX = -80;
      }

      // 6 Layered undulating oceanic swells for increased depth
      const wavesConfig = [
        { yOffset: -15, amp: 10, freq: 0.004, speed: 0.8, color: 'rgba(250, 152, 132, 0.15)', foamColor: 'rgba(255, 255, 255, 0.15)' },
        { yOffset: -5, amp: 14, freq: 0.005, speed: 1.1, color: 'rgba(250, 152, 132, 0.25)', foamColor: 'rgba(255, 255, 255, 0.25)' },
        { yOffset: 5, amp: 18, freq: 0.006, speed: 1.4, color: 'rgba(240, 155, 133, 0.30)', foamColor: 'rgba(255, 255, 255, 0.35)' },
        { yOffset: 15, amp: 22, freq: 0.007, speed: 1.7, color: 'rgba(231, 158, 133, 0.35)', foamColor: 'rgba(255, 255, 255, 0.45)' },
        { yOffset: 25, amp: 26, freq: 0.008, speed: 2.0, color: 'rgba(245, 190, 160, 0.38)', foamColor: 'rgba(255, 255, 255, 0.55)' },
        { yOffset: 35, amp: 30, freq: 0.009, speed: 2.3, color: 'rgba(255, 229, 202, 0.42)', foamColor: 'rgba(255, 255, 255, 0.70)' },
      ];

      wavesConfig.forEach((w, index) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, height);

        // Draw Wave Fill
        for (let x = 0; x <= width; x += 15) {
          const y =
            baseWaveY +
            w.yOffset +
            Math.sin(x * w.freq + waveTime * w.speed) * w.amp +
            Math.cos(x * w.freq * 0.5 + waveTime * 0.7) * (w.amp * 0.5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = w.color;
        ctx.fill();

        // Draw Foam Line for this wave
        ctx.beginPath();
        for (let x = 0; x <= width; x += 15) {
          const y =
            baseWaveY +
            w.yOffset +
            Math.sin(x * w.freq + waveTime * w.speed) * w.amp +
            Math.cos(x * w.freq * 0.5 + waveTime * 0.7) * (w.amp * 0.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = w.foamColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Draw Monument Valley Boat on a middle swell
        if (index === 3) {
          const boatWaveY =
            baseWaveY +
            w.yOffset +
            Math.sin(boatX * w.freq + waveTime * w.speed) * w.amp +
            Math.cos(boatX * w.freq * 0.5 + waveTime * 0.7) * (w.amp * 0.5);
          const waveSlope =
            Math.cos(boatX * w.freq + waveTime * w.speed) * (w.amp * w.freq) -
            Math.sin(boatX * w.freq * 0.5 + waveTime * 0.7) * (w.amp * 0.5 * w.freq * 0.5);
          const boatPitch = Math.atan(waveSlope) * 0.85 + Math.sin(waveTime * 2.2) * 0.04;

          drawMonumentBoat(boatX, boatWaveY, boatPitch);
        }
      });
    };

    let lastTime = performance.now();

    // --- Main Render Loop ---
    const render = (timeVal: number) => {
      const delta = Math.min((timeVal - lastTime) / 16.667, 2);
      lastTime = timeVal;

      ctx.clearRect(0, 0, width, height);

      // --- RENDER PER REALM ---

      if (theme === 'rose') {
        // --- ROSE REALM: Beautiful Slow Wind Whirl of Rose Petals & Dawn Motes ---

        // 1. Shimmering Dawn Glow Motes tracing the wind stream
        for (let i = 0; i < roseGlows.length; i++) {
          const g = roseGlows[i];
          g.orbitAngle += g.orbitSpeed * delta;
          g.pulsePhase += g.pulseSpeed * delta;
          g.centerX += g.driftX * delta;
          g.centerY += g.driftY * delta;

          if (g.centerX > width + 180) g.centerX = -100;
          if (g.centerY > height + 150) g.centerY = -80;

          const relX = Math.cos(g.orbitAngle) * g.radiusX;
          const relY = Math.sin(g.orbitAngle) * g.radiusY;
          const gx = g.centerX + relX;
          const gy = g.centerY + relY;
          const pulse = 0.75 + Math.sin(g.pulsePhase) * 0.25;

          drawRoseGlow(g, gx, gy, pulse);
        }

        // 2. Swirling 3D Wind Whirl Petals
        for (let i = 0; i < petals.length; i++) {
          const p = petals[i];
          p.orbitAngle += p.orbitSpeed * delta;
          p.flutterPhase += p.flutterSpeed * delta;
          p.flip += p.flipSpeed * delta;
          p.rotation += p.rotationSpeed * delta;
          p.centerX += p.driftX * delta;
          p.centerY += p.driftY * delta;

          // Seamless loop wrap
          if (p.centerX > width + 260) p.centerX = -180;
          if (p.centerY > height + 220) p.centerY = -120;
          if (p.centerX < -260) p.centerX = width + 180;
          if (p.centerY < -220) p.centerY = height + 120;

          // 2.5D Elliptical wind whirlwind calculation with gentle fluttering
          const cosA = Math.cos(p.orbitAngle);
          const sinA = Math.sin(p.orbitAngle);

          // Raw offset with micro-fluttering
          const rawX = cosA * p.radiusX + Math.sin(p.flutterPhase) * p.flutterAmp;
          const rawY = sinA * p.radiusY + Math.cos(p.flutterPhase * 0.75) * (p.flutterAmp * 0.55);

          // Tilted whirlwind plane transformation
          const cosT = Math.cos(p.tiltAngle);
          const sinT = Math.sin(p.tiltAngle);
          const tiltedX = rawX * cosT - rawY * sinT;
          const tiltedY = rawX * sinT + rawY * cosT;

          p.x = p.centerX + tiltedX;
          p.y = p.centerY + tiltedY;

          // Perspective depth modulation based on whirlwind position (sinA > 0 swirls in foreground)
          const depthProgress = (sinA + 1) * 0.5; // 0 (background) to 1 (foreground)
          const depthScale = 0.75 + depthProgress * 0.45;
          const depthOpacity = 0.65 + depthProgress * 0.4;

          drawPetal(p, depthScale, depthOpacity);
        }
      } else if (theme === 'teal') {
        // --- TEAL REALM: Flowing Row of Sacred Leaves Entering Left -> Center Swirl Loop -> Wind Gust Exit Right ---

        const centerX = width * 0.50;
        const centerY = height * 0.48;

        // 1. Draw Monument Valley Hanging Forest Boughs (Top Framing)
        drawHangingTealBranches(timeVal);

        // 2. Subtle translucent flowing wind streamlines (inspired by reference drawing)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.0;
        ctx.setLineDash([10, 14]);

        // Streamline 1 (Upper breeze line)
        ctx.beginPath();
        ctx.moveTo(-50, centerY - 28);
        ctx.bezierCurveTo(centerX * 0.45, centerY - 48, centerX - 60, centerY + 15, centerX, centerY);
        ctx.bezierCurveTo(centerX + 65, centerY - 20, centerX * 1.5, centerY + 30, width + 50, centerY - 20);
        ctx.stroke();

        // Streamline 2 (Lower breeze line)
        ctx.beginPath();
        ctx.moveTo(-50, centerY + 25);
        ctx.bezierCurveTo(centerX * 0.48, centerY + 40, centerX - 45, centerY - 30, centerX, centerY - 12);
        ctx.bezierCurveTo(centerX + 55, centerY + 22, centerX * 1.55, centerY - 20, width + 50, centerY + 25);
        ctx.stroke();
        ctx.restore();

        // 1. Forest Spores tracing the wind gust path
        for (let i = 0; i < tealSpores.length; i++) {
          const s = tealSpores[i];
          s.progress += s.speed * delta;
          s.pulsePhase += s.pulseSpeed * delta;

          if (s.progress >= 1.0) {
            s.progress -= 1.0;
            s.rowOffsetY = (Math.random() - 0.5) * 90;
            s.swirlRadiusOffset = (Math.random() - 0.5) * 35;
            s.swirlPhaseOffset = (Math.random() - 0.5) * 0.4;
          }

          const sp = s.progress;
          let sx = 0;
          let sy = 0;
          let sAlpha = s.alpha * (0.8 + Math.sin(s.pulsePhase) * 0.2);

          if (sp < 0.38) {
            const tNorm = Math.max(0, sp) / 0.38;
            sx = -140 + tNorm * (centerX - 80 + 140);
            const wave = Math.sin(tNorm * Math.PI * 1.5) * 25;
            sy = centerY + s.rowOffsetY * (1.0 - tNorm * 0.3) + wave;
            sAlpha *= Math.min(1.0, tNorm * 3.5);
          } else if (sp < 0.68) {
            const tNorm = (sp - 0.38) / 0.30;
            const theta = Math.PI * 1.0 + tNorm * Math.PI * 2.15 + s.swirlPhaseOffset;
            const vortexEnvelope = Math.sin(tNorm * Math.PI);
            const rx = 120 * (0.45 + vortexEnvelope * 0.55) + s.swirlRadiusOffset;
            const ry = 70 * (0.45 + vortexEnvelope * 0.55) + s.swirlRadiusOffset * 0.55;
            const vx = centerX + (tNorm - 0.5) * 35;
            const vy = centerY + Math.sin(tNorm * Math.PI) * -18;
            sx = vx + Math.cos(theta) * rx;
            sy = vy + Math.sin(theta) * ry + s.rowOffsetY * 0.3;
          } else {
            const tNorm = Math.min(1.0, (sp - 0.68) / 0.32);
            const easeT = Math.pow(tNorm, 1.3);
            const startX = centerX + 70;
            const endX = width + 140;
            sx = startX + easeT * (endX - startX);
            const exitWave = Math.sin(tNorm * Math.PI * 1.2) * -40;
            sy = centerY + s.rowOffsetY * (0.35 + tNorm * 0.7) + exitWave;
            sAlpha *= Math.max(0, 1.0 - Math.pow(Math.max(0, tNorm - 0.7) / 0.3, 2));
          }

          drawTealSpore(s, sx, sy, sAlpha);
        }

        // 2. Flowing Clean, Spacious Cluster of 12 Sacred Leaves
        for (let i = 0; i < leaves.length; i++) {
          const l = leaves[i];
          l.progress += l.speed * delta;
          l.flutterPhase += l.flutterSpeed * delta;
          l.flip += l.flipSpeed * delta;
          l.rotation += l.rotationSpeed * delta;

          if (l.progress >= 1.0) {
            // Loop back cleanly
            l.progress -= 1.0;
            l.rowOffsetY = (Math.random() - 0.5) * 120;
            l.swirlRadiusOffset = (Math.random() - 0.5) * 35;
            l.swirlPhaseOffset = (Math.random() - 0.5) * 0.35;
          }

          const p = l.progress;
          const flutter = Math.sin(l.flutterPhase) * l.flutterAmp;

          let lx = 0;
          let ly = 0;
          let scaleFactor = 1.0;
          let alphaFactor = 1.0;
          let flowRotation = l.rotation;

          if (p < 0.38) {
            // --- STAGE 1: Entering Left in Spacious Flow towards Center ---
            const tNorm = Math.max(0, p) / 0.38;
            lx = -140 + tNorm * (centerX - 80 + 140);
            const wave = Math.sin(tNorm * Math.PI * 1.5) * 28;
            ly = centerY + l.rowOffsetY * (1.0 - tNorm * 0.3) + wave + flutter;
            scaleFactor = 0.88 + tNorm * 0.22;
            alphaFactor = Math.min(1.0, Math.max(0, (lx + 120) / 80));
            flowRotation = l.rotation + Math.cos(tNorm * Math.PI * 1.5) * 0.3;
          } else if (p < 0.68) {
            // --- STAGE 2: Spacious 360° Center Swirl (No Clutter) ---
            const tNorm = (p - 0.38) / 0.30;
            const theta = Math.PI * 1.0 + tNorm * Math.PI * 2.2 + l.swirlPhaseOffset;
            const vortexEnvelope = Math.sin(tNorm * Math.PI);
            const rx = 135 * (0.45 + vortexEnvelope * 0.55) + l.swirlRadiusOffset;
            const ry = 75 * (0.45 + vortexEnvelope * 0.55) + l.swirlRadiusOffset * 0.55;
            const vx = centerX + (tNorm - 0.5) * 40;
            const vy = centerY + Math.sin(tNorm * Math.PI) * -20;

            lx = vx + Math.cos(theta) * rx;
            ly = vy + Math.sin(theta) * ry + l.rowOffsetY * 0.35 + flutter * 0.6;
            scaleFactor = 0.95 + Math.sin(theta) * 0.25;
            alphaFactor = 1.0;
            flowRotation = theta + Math.PI * 0.5 + l.rotation * 0.25;
          } else {
            // --- STAGE 3: Wind Gust Sweeps Leaves Smoothly to the Right ---
            const tNorm = Math.min(1.0, (p - 0.68) / 0.32);
            const easeT = Math.pow(tNorm, 1.3);
            const startX = centerX + 70;
            const endX = width + 150;
            lx = startX + easeT * (endX - startX);
            const exitWave = Math.sin(tNorm * Math.PI * 1.2) * -45;
            ly = centerY + l.rowOffsetY * (0.35 + tNorm * 0.8) + exitWave + flutter;
            scaleFactor = 1.05 - tNorm * 0.2;
            alphaFactor = Math.max(0, 1.0 - Math.pow(Math.max(0, tNorm - 0.75) / 0.25, 2));
            flowRotation = -0.25 + tNorm * 0.4 + l.rotation * 0.3;
          }

          l.x = lx;
          l.y = ly;

          drawLeaf(l, scaleFactor, alphaFactor, flowRotation);
        }
      } else if (theme === 'twilight') {
        // --- TWILIGHT REALM: Starry Night, Broken Stars, Falling Comets ---

        // 1. Twinkling Stars
        for (let i = 0; i < stars.length; i++) {
          const st = stars[i];
          st.twinklePhase += st.twinkleSpeed * delta;
          const alpha = st.baseAlpha + Math.sin(st.twinklePhase) * 0.35;

          ctx.save();
          ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
          ctx.fillStyle = '#FFFFFF';

          if (st.isCross) {
            // 4-point Diamond Star
            ctx.beginPath();
            ctx.moveTo(st.x, st.y - st.size * 2.2);
            ctx.lineTo(st.x + st.size * 0.6, st.y);
            ctx.lineTo(st.x, st.y + st.size * 2.2);
            ctx.lineTo(st.x - st.size * 0.6, st.y);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(st.x - st.size * 2.2, st.y);
            ctx.lineTo(st.x, st.y + st.size * 0.6);
            ctx.lineTo(st.x + st.size * 2.2, st.y);
            ctx.lineTo(st.x - st.size * 0.6, st.y);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // 2. Falling Comets / Meteors
        cometTimer += delta;
        if (cometTimer > 70 && comets.length < 3) {
          spawnComet();
          cometTimer = 0;
        }

        for (let i = comets.length - 1; i >= 0; i--) {
          const c = comets[i];
          c.life += delta;
          c.x += Math.cos(c.angle) * c.speed * delta;
          c.y += Math.sin(c.angle) * c.speed * delta;
          const progress = c.life / c.maxLife;
          c.alpha = 1 - progress;

          if (c.alpha <= 0 || c.x < -100 || c.y > height + 100) {
            comets.splice(i, 1);
            continue;
          }

          // Draw comet with glowing fading tail
          ctx.save();
          const tailX = c.x - Math.cos(c.angle) * c.length;
          const tailY = c.y - Math.sin(c.angle) * c.length;

          const cometGrad = ctx.createLinearGradient(tailX, tailY, c.x, c.y);
          cometGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          cometGrad.addColorStop(0.7, 'rgba(199, 210, 254, 0.4)');
          cometGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(c.x, c.y);
          ctx.strokeStyle = cometGrad;
          ctx.lineWidth = c.thickness;
          ctx.lineCap = 'round';
          ctx.globalAlpha = c.alpha;
          ctx.stroke();

          // Comet head glow
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.thickness * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.restore();
        }
      } else if (theme === 'sand') {
        // --- SAND REALM: Rolling Ocean Waves hitting Shore + Golden Sand Mist ---

        // 1. Draw Rolling Shore Waves with Monument Valley Boat
        drawOceanWaves(delta);

        // 2. Sand Dust / Golden Sunflecks
        for (let i = 0; i < sandDust.length; i++) {
          const sd = sandDust[i];
          sd.phase += 0.02 * delta;
          sd.x += (sd.speedX + Math.sin(sd.phase) * 0.3) * delta;
          sd.y += (sd.speedY + Math.cos(sd.phase * 0.7) * 0.2) * delta;

          if (sd.x > width + 20) sd.x = -20;
          if (sd.y > height + 20) {
            sd.y = -20;
            sd.x = Math.random() * width;
          }

          ctx.save();
          ctx.fillStyle = sd.color;
          ctx.globalAlpha = sd.alpha * (0.8 + Math.sin(sd.phase) * 0.2);
          ctx.beginPath();
          ctx.arc(sd.x, sd.y, sd.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 3. Shoreline Sea Foam Particles
        for (let i = 0; i < foamParticles.length; i++) {
          const fp = foamParticles[i];
          fp.x += fp.speedX * delta;
          fp.y += fp.speedY * delta;
          fp.alpha -= fp.decay * delta;

          if (fp.alpha <= 0) {
            fp.x = Math.random() * width;
            fp.y = height * 0.78 + Math.random() * (height * 0.22);
            fp.alpha = Math.random() * 0.5 + 0.2;
          }

          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.globalAlpha = fp.alpha;
          ctx.beginPath();
          ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      id="realm-atmosphere-canvas"
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.9 }}
    />
  );
};
