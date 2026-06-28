export const STORAGE_VERSION = 4

export type IncomeType = '40_1' | '40_2' | '40_3' | '40_4' | '40_5' | '40_6' | '40_7' | '40_8'

export type FilingForm = 'PND90' | 'PND91' | 'PND94'
export type FilingMode = 'quick_estimate' | 'filing_prep' | 'review_export'
export type FilingStatus = 'single' | 'married_separate' | 'married_joint'
export type TaxResidency = 'resident' | 'non_resident'
export type ExpenseMethodType = 'standard' | 'actual'
export type TaxCreditType = 'withholding' | 'dividend' | 'midyear' | 'other'

export interface Income {
  id: string
  t: string
  a: number
  tp: IncomeType
  wht: number
}

export interface TaxFilingProfile {
  taxYear: number
  mode: FilingMode
  residency: TaxResidency
  filingStatus: FilingStatus
  spouseHasIncome: boolean
  forceForm?: FilingForm
}

export interface ExpenseMethod {
  id: string
  incomeType: IncomeType
  method: ExpenseMethodType
  subtype: string
  standardRate: number
  actualAmount: number
}

export interface TaxCredit {
  id: string
  label: string
  type: TaxCreditType
  amount: number
  source?: string
}

export interface TaxFilingDraft {
  profile: TaxFilingProfile
  expenseMethods: ExpenseMethod[]
  credits: TaxCredit[]
  notes: string
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
  parents: number
  disabled: number
  maternity: number
  lifeIns: number
  healthIns: number
  parentHealthIns: number
  pensionLifeIns: number
  pvd: number
  gpf: number
  teacherFund: number
  nssf: number
  sso: number
  rmf: number
  ssf: number
  thaiEsg: number
  thaiEsgX: number
  homeLoan: number
  generalDonation: number
  educationDonation: number
  socialEnterprise: number
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
  taxFiling: TaxFilingDraft
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

export interface TaxLineItem {
  label: string
  amount: number
}

export interface TaxRule {
  id: string
  label: string
  year: number
  effectiveDate: string
  sourceUrl: string
  formula: string
  cap?: string
  eligibility?: string
  formMapping?: FilingForm[]
}

export interface TaxYearRuleSet {
  country: 'TH'
  taxYear: number
  ruleVersion: string
  effectiveDate: string
  sourceUrls: string[]
  rules: TaxRule[]
}

export interface TaxCalculationTrace {
  id: string
  label: string
  amount: number
  formula: string
  sourceUrl: string
  inputRefs: string[]
  kind: 'income' | 'expense' | 'deduction' | 'credit' | 'tax'
}

export interface TaxValidationIssue {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  field?: string
  action?: string
  sourceUrl?: string
}

export interface TaxDocumentRequirement {
  id: string
  label: string
  reason: string
  requiredWhen: string
  sourceUrl: string
  status: 'required' | 'recommended' | 'not_needed'
}

export interface FilingPackage {
  generatedAt: string
  taxYear: number
  ruleVersion: string
  formHint: string
  summary: Pick<TaxEstimate, 'ann' | 'exd' | 'tot' | 'net' | 'taxBeforeCredits' | 'withholdingCredit' | 'taxPayable' | 'refund'>
  validationIssues: TaxValidationIssue[]
  documentRequirements: TaxDocumentRequirement[]
  trace: TaxCalculationTrace[]
  sourceUrls: string[]
}

export interface TaxEstimate {
  taxYear: number
  ruleVersion: string
  ann: number
  net: number
  tax: number
  taxBeforeCredits: number
  withholdingCredit: number
  taxPayable: number
  refund: number
  mg: number
  bd: TaxBracketResult[]
  exd: number
  tot: number
  incomeByType: TaxLineItem[]
  expenseByType: TaxLineItem[]
  deductionBreakdown: TaxLineItem[]
  warnings: string[]
  sourceUrls: string[]
  formHint: string
  filingForms: FilingForm[]
  validationIssues: TaxValidationIssue[]
  trace: TaxCalculationTrace[]
  documentRequirements: TaxDocumentRequirement[]
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
