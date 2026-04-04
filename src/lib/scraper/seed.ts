// Données réalistes basées sur le marché immobilier actuel
// Zone Bourgoin-Jallieu / Nord-Isère — prix réels constatés 2024-2026
// Sources : DVF data.gouv, Meilleurs Agents, annonces réelles consultées

import type { Annonce } from '@/types/annonce'
import { enrichAnnonce } from '../scoring/pepite'
import { detectSaleType } from './salefilter'

interface SeedTemplate {
  title: string
  prix: number
  surface: number
  nbPieces: number
  nbChambres: number
  etage: number
  dpe: string
  charges: number
  taxeFonciere: number
  ville: string
  codePostal: string
  zoneSlug: string
  lat: number
  lng: number
  joursEnLigne: number
  description: string
  source: 'LEBONCOIN' | 'SELOGER' | 'BIENICI' | 'PAP'
}

// Annonces réalistes basées sur ce qui se vend vraiment dans le secteur
const SEED_TEMPLATES: SeedTemplate[] = [
  // BOURGOIN CENTRE — Score LCD 9
  {
    title: "T2 42m² centre-ville Bourgoin, proche gare",
    prix: 72000, surface: 42, nbPieces: 2, nbChambres: 1, etage: 2,
    dpe: 'F', charges: 95, taxeFonciere: 480,
    ville: 'Bourgoin-Jallieu', codePostal: '38300', zoneSlug: 'bourgoin-centre',
    lat: 45.5862, lng: 5.2731, joursEnLigne: 45,
    description: "Appartement T2 lumineux au 2ème étage, séjour avec cuisine ouverte, une chambre, salle d'eau. Proche gare SNCF (5 min à pied). DPE F — potentiel rénovation. Copropriété de 12 lots. Charges faibles.",
    source: 'LEBONCOIN',
  },
  {
    title: "Appartement T2 48m² Bourgoin centre, balcon",
    prix: 89000, surface: 48, nbPieces: 2, nbChambres: 1, etage: 3,
    dpe: 'E', charges: 110, taxeFonciere: 520,
    ville: 'Bourgoin-Jallieu', codePostal: '38300', zoneSlug: 'bourgoin-centre',
    lat: 45.5848, lng: 5.2755, joursEnLigne: 12,
    description: "Bel appartement T2 avec balcon sud, vue dégagée. Séjour lumineux, cuisine séparée aménagée, chambre avec placard. Cave. Résidence calme. Proche commerces et gare.",
    source: 'BIENICI',
  },
  {
    title: "T3 62m² Bourgoin, à rénover, beau potentiel",
    prix: 85000, surface: 62, nbPieces: 3, nbChambres: 2, etage: 1,
    dpe: 'G', charges: 130, taxeFonciere: 580,
    ville: 'Bourgoin-Jallieu', codePostal: '38300', zoneSlug: 'bourgoin-centre',
    lat: 45.5870, lng: 5.2718, joursEnLigne: 67,
    description: "T3 à rénover entièrement. Beau volume, deux chambres, séjour traversant. Copropriété saine. Idéal investisseur : prix bas + DPE G = fort potentiel de plus-value après travaux. Vendeur motivé.",
    source: 'LEBONCOIN',
  },
  {
    title: "Studio 28m² meublé Bourgoin gare",
    prix: 52000, surface: 28, nbPieces: 1, nbChambres: 0, etage: 4,
    dpe: 'E', charges: 65, taxeFonciere: 320,
    ville: 'Bourgoin-Jallieu', codePostal: '38300', zoneSlug: 'bourgoin-centre',
    lat: 45.5855, lng: 5.2745, joursEnLigne: 8,
    description: "Studio meublé au dernier étage, kitchenette équipée, coin nuit séparé par verrière. Idéal premier investissement locatif. À 3 minutes de la gare. Loué actuellement 380€/mois.",
    source: 'PAP',
  },
  {
    title: "T2 38m² rénové, Bourgoin hyper-centre",
    prix: 95000, surface: 38, nbPieces: 2, nbChambres: 1, etage: 1,
    dpe: 'D', charges: 85, taxeFonciere: 450,
    ville: 'Bourgoin-Jallieu', codePostal: '38300', zoneSlug: 'bourgoin-centre',
    lat: 45.5858, lng: 5.2762, joursEnLigne: 5,
    description: "T2 entièrement rénové en 2024. Cuisine équipée neuve, salle d'eau moderne, parquet. Double vitrage. DPE D. Prêt à louer. Hyper-centre, tous commerces à pied.",
    source: 'SELOGER',
  },

  // CRÉMIEU — Score LCD 8
  {
    title: "T2 45m² cité médiévale Crémieu, charme",
    prix: 98000, surface: 45, nbPieces: 2, nbChambres: 1, etage: 1,
    dpe: 'E', charges: 75, taxeFonciere: 430,
    ville: 'Crémieu', codePostal: '38460', zoneSlug: 'cremieu',
    lat: 45.7261, lng: 5.2498, joursEnLigne: 22,
    description: "Charmant T2 en plein cœur de la cité médiévale de Crémieu. Pierres apparentes, poutres, cachet authentique. Idéal Airbnb premium — les touristes adorent. Halles médiévales à 50m.",
    source: 'LEBONCOIN',
  },
  {
    title: "Appartement T3 55m² Crémieu, vue remparts",
    prix: 125000, surface: 55, nbPieces: 3, nbChambres: 2, etage: 2,
    dpe: 'D', charges: 90, taxeFonciere: 520,
    ville: 'Crémieu', codePostal: '38460', zoneSlug: 'cremieu',
    lat: 45.7248, lng: 5.2515, joursEnLigne: 15,
    description: "T3 avec vue imprenable sur les remparts. Deux chambres, séjour lumineux, cuisine aménagée. Résidence de standing dans la cité historique. Parking privatif.",
    source: 'BIENICI',
  },

  // LA TOUR-DU-PIN — Score LCD 6
  {
    title: "T2 40m² La Tour-du-Pin, prix cassé",
    prix: 48000, surface: 40, nbPieces: 2, nbChambres: 1, etage: 0,
    dpe: 'F', charges: 70, taxeFonciere: 350,
    ville: 'La Tour-du-Pin', codePostal: '38110', zoneSlug: 'la-tour-du-pin',
    lat: 45.5635, lng: 5.4432, joursEnLigne: 89,
    description: "T2 RDC avec jardinet privatif. À rénover. Prix très attractif pour la sous-préfecture. Proche gare TER. Quasi aucune concurrence Airbnb dans le secteur. Rendement potentiel > 12%.",
    source: 'LEBONCOIN',
  },
  {
    title: "T3 65m² La Tour-du-Pin, garage",
    prix: 68000, surface: 65, nbPieces: 3, nbChambres: 2, etage: 1,
    dpe: 'E', charges: 95, taxeFonciere: 420,
    ville: 'La Tour-du-Pin', codePostal: '38110', zoneSlug: 'la-tour-du-pin',
    lat: 45.5625, lng: 5.4418, joursEnLigne: 34,
    description: "Grand T3 avec garage fermé. Deux chambres spacieuses, séjour double, cuisine séparée. Copropriété de 8 lots. Charges très faibles. Idéal LCD pour ouvriers et pros en déplacement.",
    source: 'PAP',
  },
  {
    title: "T2 35m² La Tour-du-Pin gare, rénové",
    prix: 55000, surface: 35, nbPieces: 2, nbChambres: 1, etage: 2,
    dpe: 'D', charges: 60, taxeFonciere: 310,
    ville: 'La Tour-du-Pin', codePostal: '38110', zoneSlug: 'la-tour-du-pin',
    lat: 45.5640, lng: 5.4440, joursEnLigne: 18,
    description: "Petit T2 rénové, proche gare. Cuisine équipée, salle d'eau refaite. DPE D. Prêt à meubler pour location courte durée.",
    source: 'SELOGER',
  },

  // LA VERPILLIÈRE — Score LCD 7
  {
    title: "T2 43m² La Verpillière, 5 min gare Lyon",
    prix: 82000, surface: 43, nbPieces: 2, nbChambres: 1, etage: 3,
    dpe: 'E', charges: 100, taxeFonciere: 470,
    ville: 'La Verpillière', codePostal: '38290', zoneSlug: 'la-verpilliere',
    lat: 45.6312, lng: 5.3010, joursEnLigne: 28,
    description: "T2 au calme, 5 minutes à pied de la gare (Lyon Part-Dieu direct 25 min). Séjour, cuisine américaine, chambre, SDB. Cave. Idéal pour pros en déplacement semaine.",
    source: 'LEBONCOIN',
  },
  {
    title: "T2 50m² La Verpillière, terrasse",
    prix: 105000, surface: 50, nbPieces: 2, nbChambres: 1, etage: 0,
    dpe: 'C', charges: 120, taxeFonciere: 530,
    ville: 'La Verpillière', codePostal: '38290', zoneSlug: 'la-verpilliere',
    lat: 45.6300, lng: 5.2995, joursEnLigne: 7,
    description: "Beau T2 RDC avec terrasse 15m². Résidence récente, très bon état. Cuisine équipée, chambre avec dressing. Place de parking. Gare à 8 min à pied.",
    source: 'BIENICI',
  },

  // CHAMPARET / MÉDIPÔLE — Score LCD 7
  {
    title: "T2 40m² Bourgoin Champaret, proche Médipôle",
    prix: 68000, surface: 40, nbPieces: 2, nbChambres: 1, etage: 2,
    dpe: 'F', charges: 85, taxeFonciere: 420,
    ville: 'Bourgoin-Jallieu', codePostal: '38300', zoneSlug: 'bourgoin-champaret',
    lat: 45.5748, lng: 5.2855, joursEnLigne: 52,
    description: "T2 secteur Champaret, à 10 min du Médipôle à pied. À rafraîchir. Copropriété bien entretenue. Clientèle cible : soignants remplaçants, familles de patients.",
    source: 'LEBONCOIN',
  },
  {
    title: "T3 58m² Champaret, 2 chambres, cave",
    prix: 92000, surface: 58, nbPieces: 3, nbChambres: 2, etage: 1,
    dpe: 'E', charges: 110, taxeFonciere: 510,
    ville: 'Bourgoin-Jallieu', codePostal: '38300', zoneSlug: 'bourgoin-champaret',
    lat: 45.5755, lng: 5.2842, joursEnLigne: 19,
    description: "T3 familial proche Médipôle. Deux chambres, séjour, cuisine séparée. Cave et place de parking. Calme et résidentiel. Bon état général.",
    source: 'SELOGER',
  },

  // L'ISLE-D'ABEAU — Score LCD 5
  {
    title: "T2 44m² L'Isle-d'Abeau, résidence récente",
    prix: 110000, surface: 44, nbPieces: 2, nbChambres: 1, etage: 2,
    dpe: 'C', charges: 130, taxeFonciere: 560,
    ville: "L'Isle-d'Abeau", codePostal: '38080', zoneSlug: 'isle-abeau',
    lat: 45.6195, lng: 5.2270, joursEnLigne: 10,
    description: "T2 dans résidence de 2018. Très bon état, balcon, parking souterrain. Proche zone commerciale et axes routiers. Plus adapté LMNP classique que LCD vu le prix.",
    source: 'BIENICI',
  },
  {
    title: "T3 70m² L'Isle-d'Abeau, garage double",
    prix: 145000, surface: 70, nbPieces: 3, nbChambres: 2, etage: 0,
    dpe: 'D', charges: 150, taxeFonciere: 620,
    ville: "L'Isle-d'Abeau", codePostal: '38080', zoneSlug: 'isle-abeau',
    lat: 45.6188, lng: 5.2255, joursEnLigne: 25,
    description: "Grand T3 RDC avec jardin privatif et garage double. Résidence calme. Proche centre commercial et écoles. Idéal famille. Prix élevé pour LCD — mieux en location classique.",
    source: 'PAP',
  },

  // Annonces pépites supplémentaires (scores élevés)
  {
    title: "T2 46m² Bourgoin, DPE G, vendeur pressé -15%",
    prix: 65000, surface: 46, nbPieces: 2, nbChambres: 1, etage: 3,
    dpe: 'G', charges: 80, taxeFonciere: 400,
    ville: 'Bourgoin-Jallieu', codePostal: '38300', zoneSlug: 'bourgoin-centre',
    lat: 45.5865, lng: 5.2728, joursEnLigne: 75,
    description: "URGENT — Vendeur muté, prix en baisse. T2 à rénover entièrement (DPE G). Très bel emplacement centre-ville. Prix initial 76 500€ → 65 000€. Négociable. Fort potentiel LCD après rénovation.",
    source: 'LEBONCOIN',
  },
  {
    title: "T2 52m² Bourgoin gare, dernier étage",
    prix: 78000, surface: 52, nbPieces: 2, nbChambres: 1, etage: 4,
    dpe: 'F', charges: 95, taxeFonciere: 460,
    ville: 'Bourgoin-Jallieu', codePostal: '38300', zoneSlug: 'bourgoin-centre',
    lat: 45.5852, lng: 5.2748, joursEnLigne: 38,
    description: "T2 dernier étage, sans vis-à-vis. Belle luminosité, vue sur les toits. À 400m de la gare. DPE F — travaux d'isolation à prévoir (fenêtres + combles). Bon rapport surface/prix.",
    source: 'BIENICI',
  },
]

export function generateSeedData(): Annonce[] {
  return SEED_TEMPLATES.map((template, index) => {
    const saleTypeResult = detectSaleType(template.title, template.description, template.prix, template.surface)
    const prixM2 = Math.round(template.prix / template.surface)

    // Simulate price drop for old listings
    let prixInitial = template.prix
    if (template.joursEnLigne > 40) {
      prixInitial = Math.round(template.prix * (1 + (template.joursEnLigne % 15 + 5) / 100)) // deterministic 5-20% above current
    }

    const base: Annonce = {
      id: `seed-${template.source.toLowerCase()}-${index}`,
      externalId: `seed-${index}`,
      source: template.source,
      url: '#',
      title: template.title,
      description: template.description,
      prix: template.prix,
      surface: template.surface,
      nbPieces: template.nbPieces,
      nbChambres: template.nbChambres,
      etage: template.etage,
      dpe: template.dpe,
      charges: template.charges,
      taxeFonciere: template.taxeFonciere,
      photos: [],
      latitude: template.lat,
      longitude: template.lng,
      adresse: '',
      codePostal: template.codePostal,
      ville: template.ville,
      prixM2,
      prixInitial,
      joursEnLigne: template.joursEnLigne,
      datePublication: new Date(Date.now() - template.joursEnLigne * 86400000).toISOString(),
      isActive: true,
      isFavorite: false,
      zoneSlug: template.zoneSlug,
      saleType: saleTypeResult.type,
      saleTypeLabel: saleTypeResult.label,
      saleTypeReason: saleTypeResult.reason,
      excludedByDefault: saleTypeResult.excluded,
    }

    return enrichAnnonce(base)
  })
}
