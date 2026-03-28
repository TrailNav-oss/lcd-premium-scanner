export interface SimulationParams {
  prixAchat: number
  budgetReno: number
  nuitee: number
  tauxOccupation: number
  menageParPassage: number
  conciergeriePct: number
  chargesMensuelles: number
  taxeFonciere: number
  cfe: number
  tauxCredit: number
  dureeCredit: number
  apport: number
}

export interface SimulationResult {
  investTotal: number
  fraisNotaire: number
  caAnnuel: number
  menageAnnuel: number
  conciergerieAnnuel: number
  commissionPlateforme: number
  chargesAnnuelles: number
  totalCharges: number
  netAvantCredit: number
  rendementBrut: number
  rendementNet: number
  mensualiteCredit: number
  cashflowMensuel: number
  cashflowAnnuel: number
}

export interface MonthlyData {
  mois: string
  ca: number
  charges: number
  cashflow: number
  occupation: number
}

export const SIMULATION_DEFAULTS: SimulationParams = {
  prixAchat: 75000,
  budgetReno: 20000,
  nuitee: 62,
  tauxOccupation: 60,
  menageParPassage: 35,
  conciergeriePct: 0,
  chargesMensuelles: 120,
  taxeFonciere: 500,
  cfe: 400,
  tauxCredit: 3.3,
  dureeCredit: 20,
  apport: 0,
}
