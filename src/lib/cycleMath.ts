import { CyclePhase, CycleSettings } from '../types';

export interface PhaseInfo {
  phase: CyclePhase;
  name: string;
  cycleDay: number;
  totalDays: number;
  daysRemainingInPhase: number;
  description: string;
  hormonalContext: string;
  themeColor: string;
  accentColor: string;
  recommendations: string[];
}

export function calculateCycleStatus(settings: CycleSettings, targetDateStr?: string): PhaseInfo {
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const lastPeriodDate = new Date(settings.lastPeriodStartDate);

  // Difference in calendar days
  const diffTime = targetDate.getTime() - lastPeriodDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const cycleLen = Math.max(21, settings.averageCycleLength || 28);
  const periodLen = Math.max(3, settings.averagePeriodLength || 5);

  // Normalized day within current cycle (1-based)
  const normalizedDay = diffDays >= 0 ? (diffDays % cycleLen) + 1 : 1;

  // Ovulation typically occurs 14 days before end of cycle
  const estimatedOvulationDay = Math.max(periodLen + 3, cycleLen - 14);
  const ovulationWindowStart = estimatedOvulationDay - 1;
  const ovulationWindowEnd = estimatedOvulationDay + 2;

  if (normalizedDay <= periodLen) {
    return {
      phase: 'menstrual',
      name: 'Menstrual Phase',
      cycleDay: normalizedDay,
      totalDays: cycleLen,
      daysRemainingInPhase: periodLen - normalizedDay + 1,
      description: 'A quiet, inward phase for rest, reflection, and cellular renewal.',
      hormonalContext: 'Estrogen and progesterone are at their lowest levels. Vitality is gently recharging.',
      themeColor: '#E6C7C2', // Soft Rose
      accentColor: '#D9777F',
      recommendations: [
        'Warm nourishing broths, magnesium, and herbal teas',
        'Gentle restorative yoga, gentle stretching, and early sleep',
        'Honoring low energy boundaries without self-judgment',
      ],
    };
  } else if (normalizedDay < ovulationWindowStart) {
    return {
      phase: 'follicular',
      name: 'Follicular Phase',
      cycleDay: normalizedDay,
      totalDays: cycleLen,
      daysRemainingInPhase: ovulationWindowStart - normalizedDay,
      description: 'Rising stamina, intellectual clarity, curiosity, and new beginnings.',
      hormonalContext: 'Follicle-stimulating hormone (FSH) and estrogen are rising, boosting focus and optimism.',
      themeColor: '#A3B18A', // Sage Green
      accentColor: '#588157',
      recommendations: [
        'Brainstorming new projects, creative journaling, and planning',
        'Fresh greens, vibrant whole foods, and moderate cardio',
        'Expanding social connections and engaging deep curiosity',
      ],
    };
  } else if (normalizedDay <= ovulationWindowEnd) {
    return {
      phase: 'ovulation',
      name: 'Ovulatory Phase',
      cycleDay: normalizedDay,
      totalDays: cycleLen,
      daysRemainingInPhase: ovulationWindowEnd - normalizedDay + 1,
      description: 'Peak magnetic energy, confident articulation, and radiant communication.',
      hormonalContext: 'Luteinizing hormone (LH) and estrogen peak. Social drive and verbal acuity are highest.',
      themeColor: '#F2CC8F', // Warm Golden Amber
      accentColor: '#E07A5F',
      recommendations: [
        'High-impact presentations, difficult conversations, and social outings',
        'Antioxidant-rich berries, light grains, and vigorous physical movement',
        'Channeling enthusiasm into expressive journaling',
      ],
    };
  } else {
    return {
      phase: 'luteal',
      name: 'Luteal Phase',
      cycleDay: normalizedDay,
      totalDays: cycleLen,
      daysRemainingInPhase: cycleLen - normalizedDay + 1,
      description: 'Nesting, detail orientation, somatic introspection, and intuitive clarity.',
      hormonalContext: 'Progesterone peaks then gently declines. The nervous system seeks grounded comfort.',
      themeColor: '#B0A8B9', // Muted Lavender
      accentColor: '#7E6B8F',
      recommendations: [
        'Completing ongoing tasks, editing, and decluttering your physical space',
        'Complex carbohydrates (sweet potatoes, oats) to stabilize serotonin',
        'Setting firm energetic boundaries, somatic breathwork, and self-compassion',
      ],
    };
  }
}
