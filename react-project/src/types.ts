export const STORAGE_VERSION = 2

export interface Income {
  id: string
  t: string
  a: number
  tp: '40_1' | '40_2' | '40_8'
}

export interface Expense {
  id: string
  t: string
  a: number
  c: 'food' | 'housing' | 'transport' | 'leisure' | 'other'
}

export interface Asset {
  id: string
  t: string
  v: number
  tp: 'deposit' | 'stock' | 'fund' | 'cash' | 'crypto' | 'real_estate'
  r: number
}

export interface Debt {
  id: string
  t: string
  b: number
  p: number
  r: number
}

export interface Deductions {
  personal: number
  spouse: number
  children: number
  lifeIns: number
  healthIns: number
  pvd: number
  sso: number
  rmf: number
  ssf: number
  thaiEsg: number
  homeLoan: number
  charity: number
  easyReceipt: number
}

export interface RetirementParams {
  ca: number
  ra: number
  le: number
  me: number
  inf: number
  rr: number
  sso: number
}

export interface DocumentRecord {
  id: string
  t: string
  c: 'tavi_50' | 'insurance' | 'receipt' | 'loan' | 'other'
  y: number
}

export interface ChatMessage {
  r: 'user' | 'bot'
  c: string
}

export interface AppState {
  storageVersion: number
  ownerName: string
  incomes: Income[]
  expenses: Expense[]
  assets: Asset[]
  debts: Debt[]
  ded: Deductions
  ret: RetirementParams
  docs: DocumentRecord[]
  chat: ChatMessage[]
}

export interface Totals {
  inc: number
  exp: number
  ast: number
  dbt: number
  nw: number
  liq: number
  sr: number
  dti: number
  em: number
  dp: number
}

export interface TaxBracketResult {
  rate: number
  tax: number
  txbl: number
}

export interface TaxEstimate {
  ann: number
  net: number
  tax: number
  mg: number
  bd: TaxBracketResult[]
  exd: number
  tot: number
  rmfR: number
  ssfR: number
  esgR: number
}

export interface LoanScenario {
  months: number
  totalInt: number
}

export interface RetirementProjection {
  yrs: number
  yp: number
  nest: number
  proj: number
  short: number
  swr: number
  wr: number
  ast: number
  sav: number
  infl: number
}

export interface HealthMetric {
  id: string
  label: string
  value: string
  tone: 'good' | 'warn' | 'bad' | 'info'
  note: string
}

export type ViewId = 'dashboard' | 'tax' | 'loan' | 'retirement' | 'vault' | 'ai'
