// Détection et filtrage des types de vente non standard
// Viager, enchères, vente en lot, indivision, nue-propriété, etc.

export type SaleType =
  | 'standard'       // Vente classique — ce qu'on cherche
  | 'viager'         // Viager libre ou occupé
  | 'encheres'       // Vente aux enchères / adjudication
  | 'nue-propriete'  // Nue-propriété (pas de jouissance)
  | 'indivision'     // Vente en indivision (parts)
  | 'lot'            // Vente en lot / immeuble entier
  | 'local-commercial' // Local commercial / professionnel
  | 'terrain'        // Terrain seul
  | 'parking'        // Parking / garage seul
  | 'programme-neuf' // Programme neuf (VEFA)
  | 'suspect'        // Prix trop bas, probablement arnaque ou erreur

export interface SaleTypeResult {
  type: SaleType
  label: string
  reason: string
  excluded: boolean  // exclu par défaut
}

const SALE_TYPE_LABELS: Record<SaleType, string> = {
  'standard': 'Vente classique',
  'viager': 'Viager',
  'encheres': 'Encheres / Adjudication',
  'nue-propriete': 'Nue-propriete',
  'indivision': 'Indivision',
  'lot': 'Vente en lot',
  'local-commercial': 'Local commercial',
  'terrain': 'Terrain',
  'parking': 'Parking / Garage',
  'programme-neuf': 'Programme neuf (VEFA)',
  'suspect': 'Prix suspect',
}

// Types exclus par défaut — pas ce qu'on cherche pour du LCD
const EXCLUDED_BY_DEFAULT: SaleType[] = [
  'viager',
  'encheres',
  'nue-propriete',
  'indivision',
  'lot',
  'local-commercial',
  'terrain',
  'parking',
  'suspect',
]

// Patterns de détection (insensible à la casse, accents normalisés)
const PATTERNS: { type: SaleType; patterns: RegExp[]; reason: string }[] = [
  {
    type: 'viager',
    patterns: [
      /viager/i,
      /rente\s*(mensuelle|viagere)/i,
      /bouquet\s*\+?\s*rente/i,
      /occup[eé]\s*(par|a\s*vie)/i,
      /droit\s*d['']usage/i,
      /usufruit/i,
    ],
    reason: 'Viager detecte dans le titre ou la description',
  },
  {
    type: 'encheres',
    patterns: [
      /ench[eè]res?/i,
      /adjudication/i,
      /vente\s*judiciaire/i,
      /tribunal/i,
      /mise\s*[aà]\s*prix/i,
      /licitation/i,
    ],
    reason: 'Vente aux encheres detectee',
  },
  {
    type: 'nue-propriete',
    patterns: [
      /nue[\s-]?propri[eé]t[eé]/i,
      /demembrement/i,
    ],
    reason: 'Nue-propriete / demembrement detecte',
  },
  {
    type: 'indivision',
    patterns: [
      /indivision/i,
      /quote[\s-]?part/i,
      /parts?\s*(sociales?|d['']indivision)/i,
    ],
    reason: 'Vente en indivision detectee',
  },
  {
    type: 'lot',
    patterns: [
      /lot\s*de\s*\d+/i,
      /immeuble\s*(entier|de\s*rapport)/i,
      /ensemble\s*immobilier/i,
      /\d+\s*lots?\s*(en\s*vente|[aà]\s*vendre)/i,
    ],
    reason: 'Vente en lot / immeuble entier detectee',
  },
  {
    type: 'local-commercial',
    patterns: [
      /local\s*commercial/i,
      /fonds?\s*de\s*commerce/i,
      /bureau[x]?\s*(professionnel|[aà]\s*vendre)/i,
      /pas[\s-]?de[\s-]?porte/i,
      /droit\s*au\s*bail/i,
    ],
    reason: 'Local commercial / professionnel detecte',
  },
  {
    type: 'terrain',
    patterns: [
      /^terrain\b/i,
      /terrain\s*(constructible|[aà]\s*b[aâ]tir|nu|seul)/i,
    ],
    reason: 'Terrain seul detecte',
  },
  {
    type: 'parking',
    patterns: [
      /^(parking|garage|box|cave)\b/i,
      /place\s*de\s*(parking|stationnement)/i,
      /^box\s*(ferm[eé]|souterrain)/i,
    ],
    reason: 'Parking / garage / cave seul detecte',
  },
  {
    type: 'programme-neuf',
    patterns: [
      /programme\s*neuf/i,
      /vefa/i,
      /livraison\s*(prevue|estimee|\d{4})/i,
      /residence\s*(neuve|en\s*construction)/i,
    ],
    reason: 'Programme neuf (VEFA) detecte',
  },
]

// Prix minimum réaliste par surface pour détecter les arnaques/erreurs
// En dessous de ça, c'est suspect (prix au m² absurdement bas)
const MIN_PRIX_M2 = 500  // 500€/m² = plancher absolu même en rural
const MIN_PRIX_ABSOLU = 15000 // En dessous de 15k€ pour un appartement = suspect

export function detectSaleType(title: string, description?: string, prix?: number, surface?: number): SaleTypeResult {
  const text = `${title} ${description || ''}`.toLowerCase()

  // Check patterns
  for (const { type, patterns, reason } of PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return {
          type,
          label: SALE_TYPE_LABELS[type],
          reason,
          excluded: EXCLUDED_BY_DEFAULT.includes(type),
        }
      }
    }
  }

  // Check suspicious price
  if (prix !== undefined) {
    if (prix < MIN_PRIX_ABSOLU) {
      return {
        type: 'suspect',
        label: SALE_TYPE_LABELS.suspect,
        reason: `Prix trop bas (${prix}€) — probablement une erreur, un parking ou une arnaque`,
        excluded: true,
      }
    }
    if (surface && surface > 10) {
      const prixM2 = prix / surface
      if (prixM2 < MIN_PRIX_M2) {
        return {
          type: 'suspect',
          label: SALE_TYPE_LABELS.suspect,
          reason: `Prix/m² anormalement bas (${Math.round(prixM2)}€/m²) — verifier le bien`,
          excluded: true,
        }
      }
    }
  }

  return {
    type: 'standard',
    label: SALE_TYPE_LABELS.standard,
    reason: '',
    excluded: false,
  }
}

export function isExcludedByDefault(type: SaleType): boolean {
  return EXCLUDED_BY_DEFAULT.includes(type)
}

export { SALE_TYPE_LABELS, EXCLUDED_BY_DEFAULT }
