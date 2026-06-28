import { useCallback, useMemo, useState } from 'react'
import type {
  AppState,
  Asset,
  ChatMessage,
  Debt,
  Deductions,
  DocumentRecord,
  Expense,
  ExpenseMethod,
  Income,
  RetirementParams,
  TaxCredit,
  TaxFilingDraft,
  TaxFilingProfile,
} from '../types'
import { STORAGE_VERSION } from '../types'
import { cloneDefaultState, STORAGE_KEY } from '../lib/defaults'
import { uid } from '../domain/format'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

const INCOME_TYPES = new Set(['40_1', '40_2', '40_3', '40_4', '40_5', '40_6', '40_7', '40_8'])
const FILING_MODES = new Set(['quick_estimate', 'filing_prep', 'review_export'])
const FILING_STATUSES = new Set(['single', 'married_separate', 'married_joint'])
const RESIDENCIES = new Set(['resident', 'non_resident'])
const FILING_FORMS = new Set(['PND90', 'PND91', 'PND94'])
const EXPENSE_METHODS = new Set(['standard', 'actual'])
const CREDIT_TYPES = new Set(['withholding', 'dividend', 'midyear', 'other'])

function isIncome(value: unknown): value is Income {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.t === 'string' &&
    isNumber(value.a) &&
    typeof value.tp === 'string' &&
    INCOME_TYPES.has(value.tp)
  )
}

function normalizeIncome(value: Income): Income {
  return {
    id: value.id,
    t: value.t,
    a: value.a,
    tp: value.tp,
    wht: isNumber(value.wht) ? value.wht : 0,
  }
}

function isExpense(value: unknown): value is Expense {
  return isRecord(value) && typeof value.id === 'string' && typeof value.t === 'string' && isNumber(value.a)
}

function isAsset(value: unknown): value is Asset {
  return isRecord(value) && typeof value.id === 'string' && typeof value.t === 'string' && isNumber(value.v) && isNumber(value.r)
}

function isDebt(value: unknown): value is Debt {
  return isRecord(value) && typeof value.id === 'string' && typeof value.t === 'string' && isNumber(value.b) && isNumber(value.p) && isNumber(value.r)
}

function normalizeDeductions(value: unknown, fallback: Deductions): Deductions {
  if (!isRecord(value)) return fallback
  return {
    personal: isNumber(value.personal) ? value.personal : fallback.personal,
    spouse: isNumber(value.spouse) ? value.spouse : fallback.spouse,
    children: isNumber(value.children) ? value.children : fallback.children,
    parents: isNumber(value.parents) ? value.parents : fallback.parents,
    disabled: isNumber(value.disabled) ? value.disabled : fallback.disabled,
    maternity: isNumber(value.maternity) ? value.maternity : fallback.maternity,
    lifeIns: isNumber(value.lifeIns) ? value.lifeIns : fallback.lifeIns,
    healthIns: isNumber(value.healthIns) ? value.healthIns : fallback.healthIns,
    parentHealthIns: isNumber(value.parentHealthIns) ? value.parentHealthIns : fallback.parentHealthIns,
    pensionLifeIns: isNumber(value.pensionLifeIns) ? value.pensionLifeIns : fallback.pensionLifeIns,
    pvd: isNumber(value.pvd) ? value.pvd : fallback.pvd,
    gpf: isNumber(value.gpf) ? value.gpf : fallback.gpf,
    teacherFund: isNumber(value.teacherFund) ? value.teacherFund : fallback.teacherFund,
    nssf: isNumber(value.nssf) ? value.nssf : fallback.nssf,
    sso: isNumber(value.sso) ? value.sso : fallback.sso,
    rmf: isNumber(value.rmf) ? value.rmf : fallback.rmf,
    ssf: isNumber(value.ssf) ? value.ssf : fallback.ssf,
    thaiEsg: isNumber(value.thaiEsg) ? value.thaiEsg : fallback.thaiEsg,
    thaiEsgX: isNumber(value.thaiEsgX) ? value.thaiEsgX : fallback.thaiEsgX,
    homeLoan: isNumber(value.homeLoan) ? value.homeLoan : fallback.homeLoan,
    generalDonation: isNumber(value.generalDonation) ? value.generalDonation : isNumber(value.charity) ? value.charity : fallback.generalDonation,
    educationDonation: isNumber(value.educationDonation) ? value.educationDonation : fallback.educationDonation,
    socialEnterprise: isNumber(value.socialEnterprise) ? value.socialEnterprise : fallback.socialEnterprise,
    easyReceipt: isNumber(value.easyReceipt) ? value.easyReceipt : fallback.easyReceipt,
  }
}

function normalizeRetirement(value: unknown, fallback: RetirementParams): RetirementParams {
  if (!isRecord(value)) return fallback
  return {
    ca: isNumber(value.ca) ? value.ca : fallback.ca,
    ra: isNumber(value.ra) ? value.ra : fallback.ra,
    le: isNumber(value.le) ? value.le : fallback.le,
    me: isNumber(value.me) ? value.me : fallback.me,
    inf: isNumber(value.inf) ? value.inf : fallback.inf,
    rr: isNumber(value.rr) ? value.rr : fallback.rr,
    sso: isNumber(value.sso) ? value.sso : fallback.sso,
  }
}

function normalizeDocs(value: unknown): DocumentRecord[] {
  return Array.isArray(value)
    ? value.filter((doc): doc is DocumentRecord => (
      isRecord(doc) && typeof doc.id === 'string' && typeof doc.t === 'string' && typeof doc.c === 'string' && isNumber(doc.y)
    ))
    : []
}

function normalizeChat(value: unknown): ChatMessage[] {
  return Array.isArray(value)
    ? value.filter((message): message is ChatMessage => (
      isRecord(message) &&
      (message.r === 'user' || message.r === 'bot') &&
      typeof message.c === 'string'
    ))
    : []
}

function normalizeTaxProfile(value: unknown, fallback: TaxFilingProfile): TaxFilingProfile {
  if (!isRecord(value)) return fallback
  return {
    taxYear: isNumber(value.taxYear) ? value.taxYear : fallback.taxYear,
    mode: typeof value.mode === 'string' && FILING_MODES.has(value.mode) ? value.mode as TaxFilingProfile['mode'] : fallback.mode,
    residency: typeof value.residency === 'string' && RESIDENCIES.has(value.residency) ? value.residency as TaxFilingProfile['residency'] : fallback.residency,
    filingStatus: typeof value.filingStatus === 'string' && FILING_STATUSES.has(value.filingStatus) ? value.filingStatus as TaxFilingProfile['filingStatus'] : fallback.filingStatus,
    spouseHasIncome: typeof value.spouseHasIncome === 'boolean' ? value.spouseHasIncome : fallback.spouseHasIncome,
    forceForm: typeof value.forceForm === 'string' && FILING_FORMS.has(value.forceForm) ? value.forceForm as TaxFilingProfile['forceForm'] : undefined,
  }
}

function normalizeExpenseMethods(value: unknown): ExpenseMethod[] {
  return Array.isArray(value)
    ? value.filter((item): item is ExpenseMethod => (
      isRecord(item) &&
      typeof item.id === 'string' &&
      typeof item.incomeType === 'string' &&
      INCOME_TYPES.has(item.incomeType) &&
      typeof item.method === 'string' &&
      EXPENSE_METHODS.has(item.method) &&
      typeof item.subtype === 'string' &&
      isNumber(item.standardRate) &&
      isNumber(item.actualAmount)
    ))
    : []
}

function normalizeTaxCredits(value: unknown): TaxCredit[] {
  return Array.isArray(value)
    ? value.filter((item): item is TaxCredit => (
      isRecord(item) &&
      typeof item.id === 'string' &&
      typeof item.label === 'string' &&
      typeof item.type === 'string' &&
      CREDIT_TYPES.has(item.type) &&
      isNumber(item.amount)
    )).map((item) => ({
      id: item.id,
      label: item.label,
      type: item.type,
      amount: item.amount,
      source: typeof item.source === 'string' ? item.source : undefined,
    }))
    : []
}

function normalizeTaxFiling(value: unknown, fallback: TaxFilingDraft): TaxFilingDraft {
  if (!isRecord(value)) return fallback
  return {
    profile: normalizeTaxProfile(value.profile, fallback.profile),
    expenseMethods: normalizeExpenseMethods(value.expenseMethods),
    credits: normalizeTaxCredits(value.credits),
    notes: typeof value.notes === 'string' ? value.notes : fallback.notes,
  }
}

export function normalizeState(value: unknown): AppState {
  const fallback = cloneDefaultState()
  if (!isRecord(value)) return fallback

  return {
    storageVersion: STORAGE_VERSION,
    ownerName: typeof value.ownerName === 'string' ? value.ownerName : fallback.ownerName,
    incomes: Array.isArray(value.incomes) ? value.incomes.filter(isIncome).map(normalizeIncome) : fallback.incomes,
    expenses: Array.isArray(value.expenses) ? value.expenses.filter(isExpense) : fallback.expenses,
    assets: Array.isArray(value.assets) ? value.assets.filter(isAsset) : fallback.assets,
    debts: Array.isArray(value.debts) ? value.debts.filter(isDebt) : fallback.debts,
    ded: normalizeDeductions(value.ded, fallback.ded),
    ret: normalizeRetirement(value.ret, fallback.ret),
    docs: normalizeDocs(value.docs),
    chat: normalizeChat(value.chat),
    taxFiling: normalizeTaxFiling(value.taxFiling, fallback.taxFiling),
  }
}

export function loadStoredState(): AppState {
  try {
  const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('lucky_wealth_state_v3') ?? localStorage.getItem('lucky_wealth_state_v2') ?? localStorage.getItem('pwh_v3')
    return stored ? normalizeState(JSON.parse(stored)) : cloneDefaultState()
  } catch {
    return cloneDefaultState()
  }
}

export function validateImportedState(value: unknown): AppState | null {
  if (!isRecord(value) || !Array.isArray(value.incomes) || !Array.isArray(value.expenses)) return null
  return normalizeState(value)
}

export function usePersistentWealthState() {
  const [state, setStateRaw] = useState<AppState>(loadStoredState)

  const persist = useCallback((next: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateRaw((prev) => {
      const next = normalizeState(updater(prev))
      persist(next)
      return next
    })
  }, [persist])

  const actions = useMemo(() => ({
    addIncome: (payload: Omit<Income, 'id'>) => updateState((s) => ({ ...s, incomes: [...s.incomes, { ...payload, wht: payload.wht || 0, id: uid('i') }] })),
    removeIncome: (id: string) => updateState((s) => ({ ...s, incomes: s.incomes.filter((item) => item.id !== id) })),
    addExpense: (payload: Omit<Expense, 'id'>) => updateState((s) => ({ ...s, expenses: [...s.expenses, { ...payload, id: uid('e') }] })),
    removeExpense: (id: string) => updateState((s) => ({ ...s, expenses: s.expenses.filter((item) => item.id !== id) })),
    addAsset: (payload: Omit<Asset, 'id'>) => updateState((s) => ({ ...s, assets: [...s.assets, { ...payload, id: uid('a') }] })),
    removeAsset: (id: string) => updateState((s) => ({ ...s, assets: s.assets.filter((item) => item.id !== id) })),
    addDebt: (payload: Omit<Debt, 'id'>) => updateState((s) => ({ ...s, debts: [...s.debts, { ...payload, id: uid('d') }] })),
    removeDebt: (id: string) => updateState((s) => ({ ...s, debts: s.debts.filter((item) => item.id !== id) })),
    updateDeductions: (key: keyof Deductions, value: number) => updateState((s) => ({ ...s, ded: { ...s.ded, [key]: value } })),
    updateTaxProfile: (patch: Partial<TaxFilingProfile>) => updateState((s) => ({ ...s, taxFiling: { ...s.taxFiling, profile: { ...s.taxFiling.profile, ...patch } } })),
    addExpenseMethod: (payload: Omit<ExpenseMethod, 'id'>) => updateState((s) => ({ ...s, taxFiling: { ...s.taxFiling, expenseMethods: [...s.taxFiling.expenseMethods, { ...payload, id: uid('xm') }] } })),
    removeExpenseMethod: (id: string) => updateState((s) => ({ ...s, taxFiling: { ...s.taxFiling, expenseMethods: s.taxFiling.expenseMethods.filter((item) => item.id !== id) } })),
    addTaxCredit: (payload: Omit<TaxCredit, 'id'>) => updateState((s) => ({ ...s, taxFiling: { ...s.taxFiling, credits: [...s.taxFiling.credits, { ...payload, id: uid('tc') }] } })),
    removeTaxCredit: (id: string) => updateState((s) => ({ ...s, taxFiling: { ...s.taxFiling, credits: s.taxFiling.credits.filter((item) => item.id !== id) } })),
    updateTaxNotes: (notes: string) => updateState((s) => ({ ...s, taxFiling: { ...s.taxFiling, notes } })),
    updateRetirement: (key: keyof RetirementParams, value: number) => updateState((s) => ({ ...s, ret: { ...s.ret, [key]: value } })),
    addDocument: (payload: Omit<DocumentRecord, 'id'>) => updateState((s) => ({ ...s, docs: [...s.docs, { ...payload, id: uid('dc') }] })),
    removeDocument: (id: string) => updateState((s) => ({ ...s, docs: s.docs.filter((item) => item.id !== id) })),
    addChat: (message: ChatMessage) => updateState((s) => ({ ...s, chat: [...s.chat, message] })),
    clearChat: () => updateState((s) => ({ ...s, chat: [] })),
    resetState: () => {
      const next = cloneDefaultState()
      setStateRaw(next)
      persist(next)
    },
    importState: (next: AppState) => {
      setStateRaw(next)
      persist(next)
    },
  }), [persist, updateState])

  return { state, actions }
}

export type WealthActions = ReturnType<typeof usePersistentWealthState>['actions']
