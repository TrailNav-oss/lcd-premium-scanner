import type { SimulationParams, SimulationResult, MonthlyData } from '@/types/simulation'
import seasonalData from '@/data/seasonal-occupancy.json'

const SEJOUR_MOYEN = 2.2 // nuits par séjour
const COMMISSION_PLATEFORME = 0.03 // Airbnb host fee ~3%
const FRAIS_NOTAIRE_PCT = 0.08

export function calculateSimulation(params: SimulationParams): SimulationResult {
  const fraisNotaire = params.prixAchat * FRAIS_NOTAIRE_PCT
  const investTotal = params.prixAchat + fraisNotaire + params.budgetReno - params.apport

  const nuitsParMois = 30.4 * (params.tauxOccupation / 100)

  // Revenus
  const caAnnuel = params.nuitee * nuitsParMois * 12

  // Charges
  const nbPassagesAn = (nuitsParMois * 12) / SEJOUR_MOYEN
  const menageAnnuel = params.menageParPassage * nbPassagesAn
  const conciergerieAnnuel = caAnnuel * (params.conciergeriePct / 100)
  const commissionPlateforme = caAnnuel * COMMISSION_PLATEFORME
  const chargesAnnuelles = params.chargesMensuelles * 12 + params.taxeFonciere + params.cfe
  const totalCharges = menageAnnuel + conciergerieAnnuel + commissionPlateforme + chargesAnnuelles

  // Résultats
  const netAvantCredit = caAnnuel - totalCharges
  const rendementBrut = investTotal > 0 ? (caAnnuel / investTotal) * 100 : 0
  const rendementNet = investTotal > 0 ? (netAvantCredit / investTotal) * 100 : 0

  // Crédit (mensualité constante)
  let mensualiteCredit = 0
  if (investTotal > 0 && params.tauxCredit > 0 && params.dureeCredit > 0) {
    const r = params.tauxCredit / 100 / 12
    const n = params.dureeCredit * 12
    mensualiteCredit = (investTotal * r) / (1 - Math.pow(1 + r, -n))
  }

  const cashflowMensuel = netAvantCredit / 12 - mensualiteCredit
  const cashflowAnnuel = cashflowMensuel * 12

  return {
    investTotal,
    fraisNotaire,
    caAnnuel,
    menageAnnuel,
    conciergerieAnnuel,
    commissionPlateforme,
    chargesAnnuelles,
    totalCharges,
    netAvantCredit,
    rendementBrut,
    rendementNet,
    mensualiteCredit,
    cashflowMensuel,
    cashflowAnnuel,
  }
}

export function calculateMonthlyData(params: SimulationParams): MonthlyData[] {
  const months = seasonalData.months
  const baseNuitsParMois = 30.4 * (params.tauxOccupation / 100)
  const chargesMensuelles = params.chargesMensuelles + params.taxeFonciere / 12 + params.cfe / 12

  // Crédit
  const investTotal = params.prixAchat * (1 + FRAIS_NOTAIRE_PCT) + params.budgetReno - params.apport
  let mensualiteCredit = 0
  if (investTotal > 0 && params.tauxCredit > 0 && params.dureeCredit > 0) {
    const r = params.tauxCredit / 100 / 12
    const n = params.dureeCredit * 12
    mensualiteCredit = (investTotal * r) / (1 - Math.pow(1 + r, -n))
  }

  return months.map((m) => {
    const nuits = baseNuitsParMois * m.coeff
    const ca = params.nuitee * nuits
    const nbPassages = nuits / SEJOUR_MOYEN
    const menage = params.menageParPassage * nbPassages
    const conciergerie = ca * (params.conciergeriePct / 100)
    const commission = ca * COMMISSION_PLATEFORME
    const totalCharges = menage + conciergerie + commission + chargesMensuelles + mensualiteCredit
    const cashflow = ca - totalCharges

    return {
      mois: m.label,
      ca: Math.round(ca),
      charges: Math.round(totalCharges),
      cashflow: Math.round(cashflow),
      occupation: Math.round(params.tauxOccupation * m.coeff),
    }
  })
}
