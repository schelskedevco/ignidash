/**
 * IRMAA (Income-Related Monthly Adjustment Amount) tier tables
 *
 * Tax year 2026.
 * Part B and Part D surcharges based on MAGI from 2 years prior.
 * Source: CMS 2026 IRMAA Fact Sheet.
 *
 * Thresholds are for MFJ; single filers use half the thresholds.
 * The surcharges are PER PERSON on Medicare.
 */

export interface IrmaaTier {
  magiThreshold: number;
  partBSurcharge: number;   // monthly per person
  partDSurcharge: number;   // monthly per person
}

export const IRMAA_TIERS_2026_MFJ: IrmaaTier[] = [
  { magiThreshold: 212_000, partBSurcharge:   0.0,  partDSurcharge:  0.0  },
  { magiThreshold: 267_000, partBSurcharge:  74.0,  partDSurcharge: 12.9  },
  { magiThreshold: 334_000, partBSurcharge: 185.0,  partDSurcharge: 33.3  },
  { magiThreshold: 750_000, partBSurcharge: 296.0,  partDSurcharge: 53.8  },
  { magiThreshold: Infinity, partBSurcharge: 370.0, partDSurcharge: 81.0  },
];