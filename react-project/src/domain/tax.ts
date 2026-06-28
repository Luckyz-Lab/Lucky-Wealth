import type {
  AppState,
  ExpenseMethod,
  FilingForm,
  IncomeType,
  TaxCalculationTrace,
  TaxDocumentRequirement,
  TaxEstimate,
  TaxLineItem,
  TaxRule,
  TaxValidationIssue,
  TaxYearRuleSet,
  FilingPackage,
} from '../types'

export const TAX_YEAR = 2569
export const RULE_VERSION = 'TH-PIT-2569-filing-prep-2026-06-28'

export const SOURCE_URLS = [
  'https://www.rd.go.th/556.html',
  'https://www.rd.go.th/557.html',
  'https://www.rd.go.th/59670.html',
  'https://www.rd.go.th/68191.html',
]

export const INCOME_LABELS: Record<IncomeType, string> = {
  '40_1': 'ม.40(1) เงินเดือน ค่าจ้าง โบนัส',
  '40_2': 'ม.40(2) รับทำงานให้ ค่านายหน้า ฟรีแลนซ์',
  '40_3': 'ม.40(3) ค่าลิขสิทธิ์ สิทธิ และทรัพย์สินทางปัญญา',
  '40_4': 'ม.40(4) ดอกเบี้ย เงินปันผล และผลประโยชน์จากเงินลงทุน',
  '40_5': 'ม.40(5) ให้เช่าทรัพย์สิน',
  '40_6': 'ม.40(6) วิชาชีพอิสระ',
  '40_7': 'ม.40(7) รับเหมาที่ผู้รับเหมาจัดหาสัมภาระ',
  '40_8': 'ม.40(8) ธุรกิจ พาณิชย์ เกษตรกรรม อุตสาหกรรม และอื่น ๆ',
}

const BRACKETS = [
  { upto: 150000, rate: 0 },
  { upto: 300000, rate: 0.05 },
  { upto: 500000, rate: 0.1 },
  { upto: 750000, rate: 0.15 },
  { upto: 1000000, rate: 0.2 },
  { upto: 2000000, rate: 0.25 },
  { upto: 5000000, rate: 0.3 },
  { upto: Infinity, rate: 0.35 },
]

const RULES: TaxRule[] = [
  {
    id: 'tax-brackets',
    label: 'อัตราภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได',
    year: TAX_YEAR,
    effectiveDate: '2026-01-01',
    sourceUrl: 'https://www.rd.go.th/59670.html',
    formula: 'คำนวณรายได้สุทธิทีละช่วงอัตรา 0%, 5%, 10%, 15%, 20%, 25%, 30%, 35%',
    formMapping: ['PND90', 'PND91', 'PND94'],
  },
  {
    id: 'expense-40-1-2',
    label: 'ค่าใช้จ่าย ม.40(1)-(2)',
    year: TAX_YEAR,
    effectiveDate: '2026-01-01',
    sourceUrl: 'https://www.rd.go.th/556.html',
    formula: '50% ของเงินได้ ม.40(1)-(2)',
    cap: 'ไม่เกิน 100,000 บาท',
    formMapping: ['PND90', 'PND91'],
  },
  {
    id: 'deductions',
    label: 'ค่าลดหย่อนและยกเว้นภาษี',
    year: TAX_YEAR,
    effectiveDate: '2026-01-01',
    sourceUrl: 'https://www.rd.go.th/557.html',
    formula: 'หักตามสิทธิและเพดานรายรายการ รวมถึงเพดานรวมกลุ่มเกษียณ 500,000 บาท',
    formMapping: ['PND90', 'PND91'],
  },
]

export const TH_2569_RULE_SET: TaxYearRuleSet = {
  country: 'TH',
  taxYear: TAX_YEAR,
  ruleVersion: RULE_VERSION,
  effectiveDate: '2026-01-01',
  sourceUrls: SOURCE_URLS,
  rules: RULES,
}

function cap(value: number, max: number): number {
  return Math.max(0, Math.min(Number.isFinite(value) ? value : 0, max))
}

function round(value: number): number {
  return Math.round(Number.isFinite(value) ? value : 0)
}

function addLine(lines: TaxLineItem[], label: string, amount: number) {
  if (amount > 0) lines.push({ label, amount: round(amount) })
}

function addTrace(
  trace: TaxCalculationTrace[],
  item: Omit<TaxCalculationTrace, 'amount'> & { amount: number },
) {
  trace.push({ ...item, amount: round(item.amount) })
}

function addIssue(
  issues: TaxValidationIssue[],
  severity: TaxValidationIssue['severity'],
  code: string,
  message: string,
  action?: string,
  sourceUrl = 'https://www.rd.go.th/557.html',
) {
  issues.push({ severity, code, message, action, sourceUrl })
}

function addCappedDeduction(
  lines: TaxLineItem[],
  trace: TaxCalculationTrace[],
  issues: TaxValidationIssue[],
  label: string,
  rawAmount: number,
  max: number,
  formula: string,
  inputRefs: string[],
  sourceUrl = 'https://www.rd.go.th/557.html',
) {
  const amount = cap(rawAmount, max)
  addLine(lines, label, amount)
  if (amount > 0) {
    addTrace(trace, {
      id: `deduction-${inputRefs.join('-')}`,
      label,
      amount,
      formula,
      sourceUrl,
      inputRefs,
      kind: 'deduction',
    })
  }
  if (rawAmount > amount) {
    addIssue(issues, 'info', `cap-${inputRefs.join('-')}`, `${label} ถูกจำกัดตามเพดาน ${round(max).toLocaleString('th-TH')} บาท`, 'ตรวจเอกสารและใช้ยอดที่กฎหมายให้หักได้จริง')
  }
  return amount
}

function sumByIncomeType(state: AppState): Record<IncomeType, number> {
  const incomeByType = Object.fromEntries(
    Object.keys(INCOME_LABELS).map((key) => [key, 0]),
  ) as Record<IncomeType, number>

  for (const item of state.incomes) {
    incomeByType[item.tp] += round(item.a * 12)
  }

  return incomeByType
}

function findExpenseMethod(state: AppState, incomeType: IncomeType): ExpenseMethod | undefined {
  return [...state.taxFiling.expenseMethods].reverse().find((item) => item.incomeType === incomeType)
}

function validateStandardExpenseRate(incomeType: IncomeType, rate: number): boolean {
  const allowed: Partial<Record<IncomeType, number[]>> = {
    '40_5': [10, 20, 30],
    '40_6': [30, 60],
    '40_7': [60],
    '40_8': [40, 60, 70, 80, 85],
  }
  return Boolean(allowed[incomeType]?.includes(rate))
}

function calcManualExpense(
  state: AppState,
  incomeByType: Record<IncomeType, number>,
  incomeType: IncomeType,
  trace: TaxCalculationTrace[],
  issues: TaxValidationIssue[],
): TaxLineItem | null {
  const income = incomeByType[incomeType]
  if (income <= 0) return null

  const method = findExpenseMethod(state, incomeType)
  if (!method) {
    addIssue(
      issues,
      'warning',
      `missing-expense-method-${incomeType}`,
      `${INCOME_LABELS[incomeType]} ต้องเลือกวิธีหักค่าใช้จ่ายตามประเภทย่อย ระบบใช้ค่าใช้จ่าย 0 บาทไว้ก่อนเพื่อไม่หักเกินจริง`,
      'ไปที่ขั้น “ค่าใช้จ่าย” แล้วเลือกแบบเหมา/ตามจริงให้ตรงกับเอกสารและลักษณะรายได้',
      'https://www.rd.go.th/556.html',
    )
    return null
  }

  const amount = method.method === 'actual'
    ? cap(method.actualAmount, income)
    : cap(income * (method.standardRate / 100), income)

  if (method.method === 'standard' && !validateStandardExpenseRate(incomeType, method.standardRate)) {
    addIssue(
      issues,
      'warning',
      `expense-rate-review-${incomeType}`,
      `อัตราเหมา ${method.standardRate}% สำหรับ ${INCOME_LABELS[incomeType]} ต้องตรวจว่าตรงกับประเภทย่อยจริง`,
      'ตรวจตารางค่าใช้จ่ายของกรมสรรพากรก่อนใช้ยื่นจริง',
      'https://www.rd.go.th/556.html',
    )
  }

  if (method.method === 'actual' && method.actualAmount > income) {
    addIssue(issues, 'warning', `actual-expense-capped-${incomeType}`, `ค่าใช้จ่ายตามจริงของ ${INCOME_LABELS[incomeType]} สูงกว่าเงินได้ ระบบจำกัดไม่ให้เกินเงินได้`, 'ตรวจเอกสารค่าใช้จ่ายตามจริง')
  }

  const label = method.method === 'actual'
    ? `ค่าใช้จ่ายตามจริง ${INCOME_LABELS[incomeType]}`
    : `ค่าใช้จ่ายเหมา ${method.standardRate}% ${INCOME_LABELS[incomeType]}`

  if (amount > 0) {
    addTrace(trace, {
      id: `expense-${incomeType}`,
      label,
      amount,
      formula: method.method === 'actual' ? 'ใช้ยอดค่าใช้จ่ายตามจริงที่กรอกและจำกัดไม่เกินเงินได้' : `เงินได้ ${income.toLocaleString('th-TH')} x ${method.standardRate}%`,
      sourceUrl: 'https://www.rd.go.th/556.html',
      inputRefs: [`income.${incomeType}`, `taxFiling.expenseMethods.${method.id}`],
      kind: 'expense',
    })
  }

  return amount > 0 ? { label, amount: round(amount) } : null
}

function calcExpenses(
  state: AppState,
  incomeByType: Record<IncomeType, number>,
  trace: TaxCalculationTrace[],
  issues: TaxValidationIssue[],
) {
  const lines: TaxLineItem[] = []

  const salaryService = incomeByType['40_1'] + incomeByType['40_2']
  const salaryExpense = cap(salaryService * 0.5, 100000)
  addLine(lines, 'ค่าใช้จ่าย ม.40(1)-(2) 50% ไม่เกิน 100,000 บาท', salaryExpense)
  if (salaryExpense > 0) {
    addTrace(trace, {
      id: 'expense-40-1-2',
      label: 'ค่าใช้จ่าย ม.40(1)-(2)',
      amount: salaryExpense,
      formula: `เงินได้ ม.40(1)-(2) ${salaryService.toLocaleString('th-TH')} x 50%, เพดาน 100,000`,
      sourceUrl: 'https://www.rd.go.th/556.html',
      inputRefs: ['income.40_1', 'income.40_2'],
      kind: 'expense',
    })
  }

  const royaltyExpense = cap(incomeByType['40_3'] * 0.5, 100000)
  addLine(lines, 'ค่าใช้จ่าย ม.40(3) 50% ไม่เกิน 100,000 บาท', royaltyExpense)
  if (royaltyExpense > 0) {
    addTrace(trace, {
      id: 'expense-40-3',
      label: 'ค่าใช้จ่าย ม.40(3)',
      amount: royaltyExpense,
      formula: `เงินได้ ม.40(3) ${incomeByType['40_3'].toLocaleString('th-TH')} x 50%, เพดาน 100,000`,
      sourceUrl: 'https://www.rd.go.th/556.html',
      inputRefs: ['income.40_3'],
      kind: 'expense',
    })
  }

  for (const incomeType of ['40_5', '40_6', '40_7', '40_8'] as IncomeType[]) {
    const manual = calcManualExpense(state, incomeByType, incomeType, trace, issues)
    if (manual) lines.push(manual)
  }

  return {
    total: round(lines.reduce((sum, line) => sum + line.amount, 0)),
    lines,
  }
}

function applyRetirementCombinedCap(
  candidates: TaxLineItem[],
  trace: TaxCalculationTrace[],
  issues: TaxValidationIssue[],
) {
  const result: TaxLineItem[] = []
  let remaining = 500000

  for (const item of candidates) {
    const amount = Math.max(0, Math.min(item.amount, remaining))
    remaining -= amount
    if (amount > 0) {
      result.push({ label: item.label, amount })
      addTrace(trace, {
        id: `deduction-retirement-${item.label}`,
        label: item.label,
        amount,
        formula: 'ใช้เพดานรายรายการแล้วจำกัดด้วยเพดานรวมกลุ่มเกษียณ 500,000 บาท',
        sourceUrl: 'https://www.rd.go.th/557.html',
        inputRefs: ['ded.retirementGroup'],
        kind: 'deduction',
      })
    }
    if (item.amount > amount) {
      addIssue(issues, 'info', 'retirement-combined-cap', `${item.label} ถูกลดเพราะเพดานรวมกลุ่มเกษียณ 500,000 บาท`, 'ตรวจยอดกองทุน/ประกันบำนาญทุกใบรวมกัน')
    }
  }

  return result
}

function calcDeductions(
  state: AppState,
  ann: number,
  expenseTotal: number,
  trace: TaxCalculationTrace[],
  issues: TaxValidationIssue[],
) {
  const d = state.ded
  const lines: TaxLineItem[] = []
  const profile = state.taxFiling.profile

  addCappedDeduction(lines, trace, issues, 'ค่าลดหย่อนส่วนตัว', d.personal || 60000, 60000, 'สิทธิพื้นฐานไม่เกิน 60,000 บาท', ['ded.personal'])

  if (d.spouse > 0 && profile.spouseHasIncome) {
    addIssue(issues, 'warning', 'spouse-has-income', 'มีการกรอกค่าลดหย่อนคู่สมรส แต่ profile ระบุว่าคู่สมรสมีเงินได้', 'ตรวจสิทธิค่าลดหย่อนคู่สมรสก่อนยื่นจริง')
  }
  addCappedDeduction(lines, trace, issues, 'คู่สมรสไม่มีเงินได้', d.spouse, 60000, 'ไม่เกิน 60,000 บาท', ['ded.spouse'])
  addCappedDeduction(lines, trace, issues, 'บุตร', d.children * 30000, 30000 * 20, 'จำนวนบุตร x 30,000 บาท', ['ded.children'])
  addCappedDeduction(lines, trace, issues, 'บิดามารดา', d.parents * 30000, 120000, 'จำนวนบิดามารดาที่เข้าเงื่อนไข x 30,000 บาท สูงสุด 4 คน', ['ded.parents'])
  addCappedDeduction(lines, trace, issues, 'อุปการะผู้พิการ/ทุพพลภาพ', d.disabled * 60000, 60000 * 20, 'จำนวนคนที่เข้าเงื่อนไข x 60,000 บาท', ['ded.disabled'])
  addCappedDeduction(lines, trace, issues, 'ฝากครรภ์และคลอดบุตร', d.maternity, 60000, 'ค่าใช้จ่ายจริงไม่เกิน 60,000 บาท', ['ded.maternity'])
  addCappedDeduction(lines, trace, issues, 'ประกันสังคม', d.sso, 9000, 'เงินสมทบจริงไม่เกิน 9,000 บาท', ['ded.sso'])

  const lifeHealth = Math.min((d.lifeIns || 0) + cap(d.healthIns, 25000), 100000)
  addCappedDeduction(lines, trace, issues, 'ประกันชีวิตและประกันสุขภาพตนเอง', lifeHealth, 100000, 'ประกันสุขภาพตนเองไม่เกิน 25,000 และรวมประกันชีวิตไม่เกิน 100,000 บาท', ['ded.lifeIns', 'ded.healthIns'])
  addCappedDeduction(lines, trace, issues, 'ประกันสุขภาพบิดามารดา', d.parentHealthIns, 15000, 'ไม่เกิน 15,000 บาท', ['ded.parentHealthIns'])

  const retirementCandidates: TaxLineItem[] = [
    { label: 'ประกันชีวิตแบบบำนาญ', amount: cap(d.pensionLifeIns, Math.min(ann * 0.15, 200000)) },
    { label: 'กองทุนสำรองเลี้ยงชีพ PVD', amount: Math.max(0, d.pvd || 0) },
    { label: 'กบข.', amount: Math.max(0, d.gpf || 0) },
    { label: 'กองทุนสงเคราะห์ครูโรงเรียนเอกชน', amount: Math.max(0, d.teacherFund || 0) },
    { label: 'กองทุนการออมแห่งชาติ', amount: cap(d.nssf, 30000) },
    { label: 'RMF', amount: cap(d.rmf, Math.min(ann * 0.3, 500000)) },
    { label: 'SSF', amount: cap(d.ssf, Math.min(ann * 0.3, 200000)) },
  ].filter((item) => item.amount > 0)
  lines.push(...applyRetirementCombinedCap(retirementCandidates, trace, issues))

  addCappedDeduction(lines, trace, issues, 'Thai ESG', d.thaiEsg, Math.min(ann * 0.3, 300000), 'ไม่เกิน 30% ของเงินได้และไม่เกิน 300,000 บาท', ['ded.thaiEsg'])
  addCappedDeduction(lines, trace, issues, 'Thai ESGX', d.thaiEsgX, Math.min(ann * 0.3, 300000), 'ใช้ตามมาตรการปีภาษีที่เกี่ยวข้อง ต้องตรวจประกาศปีนั้น', ['ded.thaiEsgX'])
  if (d.thaiEsgX > 0) {
    addIssue(issues, 'warning', 'thai-esgx-year-check', 'Thai ESGX เป็นมาตรการเฉพาะปีและมีเงื่อนไขละเอียด', 'ตรวจประกาศกรมสรรพากรและเอกสารกองทุนก่อนใช้ยื่นจริง')
  }

  addCappedDeduction(lines, trace, issues, 'ดอกเบี้ยกู้ยืมเพื่อที่อยู่อาศัย', d.homeLoan, 100000, 'ดอกเบี้ยจริงไม่เกิน 100,000 บาท', ['ded.homeLoan'])
  addCappedDeduction(lines, trace, issues, 'ลงทุนวิสาหกิจเพื่อสังคม', d.socialEnterprise, 100000, 'ไม่เกิน 100,000 บาท และต้องเป็นกิจการที่เข้าเงื่อนไข', ['ded.socialEnterprise'])
  addCappedDeduction(lines, trace, issues, 'Easy E-Receipt', d.easyReceipt, 50000, 'ไม่เกิน 50,000 บาทตามช่วงเวลามาตรการ', ['ded.easyReceipt'])
  if (d.easyReceipt > 0) {
    addIssue(issues, 'warning', 'easy-receipt-period-check', 'Easy E-Receipt ต้องตรวจช่วงเวลาซื้อสินค้า/บริการและประเภทผู้ขายของปีภาษีนั้น', 'เก็บ e-Tax invoice/e-Receipt และตรวจมาตรการล่าสุดก่อนยื่นจริง')
  }

  const preDonationDeductions = lines.reduce((sum, line) => sum + line.amount, 0)
  const preDonationNet = Math.max(0, ann - expenseTotal - preDonationDeductions)
  const educationDonation = cap(d.educationDonation * 2, preDonationNet * 0.1)
  addCappedDeduction(lines, trace, issues, 'บริจาคการศึกษา/กีฬา/สาธารณประโยชน์', educationDonation, preDonationNet * 0.1, 'ยอดบริจาค x 2 แต่ไม่เกิน 10% ของเงินได้หลังหักค่าใช้จ่ายและค่าลดหย่อนก่อนบริจาค', ['ded.educationDonation'])
  const generalDonationBase = Math.max(0, preDonationNet - educationDonation)
  addCappedDeduction(lines, trace, issues, 'บริจาคทั่วไป', d.generalDonation, generalDonationBase * 0.1, 'ไม่เกิน 10% ของฐานหลังหักบริจาคพิเศษ', ['ded.generalDonation'])

  return {
    total: round(lines.reduce((sum, line) => sum + line.amount, 0)),
    lines,
  }
}

function calcTaxByBrackets(net: number, trace: TaxCalculationTrace[]): Pick<TaxEstimate, 'bd' | 'mg' | 'taxBeforeCredits'> {
  let previousLimit = 0
  let taxBeforeCredits = 0
  let mg = 0
  const bd: TaxEstimate['bd'] = []

  for (const bracket of BRACKETS) {
    const taxable = Math.max(0, Math.min(net, bracket.upto) - previousLimit)
    const bracketTax = round(taxable * bracket.rate)
    if (taxable > 0 && bracket.rate > 0) mg = bracket.rate * 100
    taxBeforeCredits += bracketTax
    if (taxable > 0) {
      bd.push({ rate: bracket.rate * 100, tax: bracketTax, txbl: round(taxable) })
      addTrace(trace, {
        id: `tax-bracket-${bracket.rate}`,
        label: `ภาษีขั้น ${bracket.rate * 100}%`,
        amount: bracketTax,
        formula: `ฐานช่วงนี้ ${round(taxable).toLocaleString('th-TH')} x ${bracket.rate * 100}%`,
        sourceUrl: 'https://www.rd.go.th/59670.html',
        inputRefs: ['tax.net'],
        kind: 'tax',
      })
    }
    previousLimit = bracket.upto
    if (net <= bracket.upto) break
  }

  return { bd, mg, taxBeforeCredits: round(taxBeforeCredits) }
}

function inferFilingForms(state: AppState): { forms: FilingForm[]; hint: string } {
  const forced = state.taxFiling.profile.forceForm
  const activeTypes = new Set(state.incomes.map((item) => item.tp))
  const hasOnlySalary = activeTypes.size > 0 && [...activeTypes].every((type) => type === '40_1')
  const hasMidYearIncome = [...activeTypes].some((type) => ['40_5', '40_6', '40_7', '40_8'].includes(type))
  const forms: FilingForm[] = []

  if (forced) forms.push(forced)
  else forms.push(hasOnlySalary ? 'PND91' : 'PND90')
  if (state.taxFiling.profile.mode === 'filing_prep' && hasMidYearIncome) forms.push('PND94')

  const uniqueForms = [...new Set(forms)]
  const hint = forced
    ? `ผู้ใช้เลือกใช้แบบ ${forced} เอง โปรดตรวจว่าเหมาะกับประเภทเงินได้`
    : hasOnlySalary
      ? 'โดยทั่วไปใช้ ภ.ง.ด.91 เมื่อมีเฉพาะเงินเดือน ม.40(1)'
      : 'โดยทั่วไปใช้ ภ.ง.ด.90 เมื่อมีเงินได้หลายประเภทหรือเงินได้ที่ไม่ใช่เงินเดือนอย่างเดียว'

  return { forms: uniqueForms, hint }
}

function buildDocumentRequirements(state: AppState, forms: FilingForm[]): TaxDocumentRequirement[] {
  const d = state.ded
  const hasIncome = state.incomes.length > 0
  const hasWithholding = state.incomes.some((item) => item.wht > 0)
  const hasDividend = state.incomes.some((item) => item.tp === '40_4') || state.taxFiling.credits.some((item) => item.type === 'dividend')

  const reqs: TaxDocumentRequirement[] = [
    {
      id: 'pnd-form',
      label: `แบบ ${forms.join(' / ')}`,
      reason: 'แบบแสดงรายการที่ระบบประเมินจากประเภทเงินได้',
      requiredWhen: 'ต้องยื่นภาษีเงินได้บุคคลธรรมดา',
      sourceUrl: 'https://www.rd.go.th/68191.html',
      status: hasIncome ? 'required' : 'recommended',
    },
    {
      id: 'tavi-50',
      label: 'หนังสือรับรองหัก ณ ที่จ่าย / ใบ 50 ทวิ',
      reason: 'ใช้ยืนยันรายได้และภาษีที่ถูกหักไว้',
      requiredWhen: 'มีเงินได้หรือมีภาษีหัก ณ ที่จ่าย',
      sourceUrl: 'https://www.rd.go.th/68191.html',
      status: hasIncome || hasWithholding ? 'required' : 'not_needed',
    },
    {
      id: 'dividend-credit',
      label: 'เอกสารเงินปันผลและเครดิตภาษีเงินปันผล',
      reason: 'ใช้คำนวณเครดิตภาษีเงินปันผลและยืนยันภาษีที่ถูกหัก',
      requiredWhen: 'มีเงินปันผลหรือกรอกเครดิตภาษีเงินปันผล',
      sourceUrl: 'https://www.rd.go.th/557.html',
      status: hasDividend ? 'required' : 'not_needed',
    },
    {
      id: 'insurance',
      label: 'หนังสือรับรองเบี้ยประกันชีวิต/สุขภาพ/บำนาญ',
      reason: 'ใช้ยืนยันสิทธิค่าลดหย่อนประกัน',
      requiredWhen: 'กรอกประกันชีวิต สุขภาพ หรือบำนาญ',
      sourceUrl: 'https://www.rd.go.th/557.html',
      status: d.lifeIns || d.healthIns || d.parentHealthIns || d.pensionLifeIns ? 'required' : 'not_needed',
    },
    {
      id: 'fund-certificates',
      label: 'หนังสือรับรองกองทุน RMF/SSF/PVD/กบข./กอช./Thai ESG',
      reason: 'ใช้ยืนยันยอดซื้อและเงื่อนไขการถือครอง',
      requiredWhen: 'กรอกค่าลดหย่อนกลุ่มกองทุน',
      sourceUrl: 'https://www.rd.go.th/557.html',
      status: d.rmf || d.ssf || d.pvd || d.gpf || d.teacherFund || d.nssf || d.thaiEsg || d.thaiEsgX ? 'required' : 'not_needed',
    },
    {
      id: 'home-loan',
      label: 'หนังสือรับรองดอกเบี้ยกู้ยืมเพื่อที่อยู่อาศัย',
      reason: 'ใช้ยืนยันดอกเบี้ยบ้านที่นำมาลดหย่อน',
      requiredWhen: 'กรอกดอกเบี้ยกู้บ้าน',
      sourceUrl: 'https://www.rd.go.th/557.html',
      status: d.homeLoan ? 'required' : 'not_needed',
    },
    {
      id: 'donations',
      label: 'หลักฐานบริจาคหรือ e-Donation',
      reason: 'ใช้ยืนยันยอดบริจาคและประเภทสิทธิ',
      requiredWhen: 'กรอกเงินบริจาค',
      sourceUrl: 'https://www.rd.go.th/557.html',
      status: d.generalDonation || d.educationDonation ? 'required' : 'not_needed',
    },
    {
      id: 'easy-ereceipt',
      label: 'e-Tax invoice / e-Receipt',
      reason: 'ใช้ยืนยันรายการ Easy E-Receipt ตามช่วงมาตรการ',
      requiredWhen: 'กรอก Easy E-Receipt',
      sourceUrl: 'https://www.rd.go.th/557.html',
      status: d.easyReceipt ? 'required' : 'not_needed',
    },
  ]

  return reqs
}

export function calcTax(state: AppState): TaxEstimate {
  const trace: TaxCalculationTrace[] = []
  const validationIssues: TaxValidationIssue[] = []
  const incomeByTypeMap = sumByIncomeType(state)
  const ann = round(Object.values(incomeByTypeMap).reduce((sum, value) => sum + value, 0))
  const withholdingFromIncome = round(state.incomes.reduce((sum, item) => sum + (item.wht || 0) * 12, 0))
  const manualCredits = round(state.taxFiling.credits.reduce((sum, item) => sum + Math.max(0, item.amount || 0), 0))
  const withholdingCredit = withholdingFromIncome + manualCredits

  if (ann <= 0) {
    addIssue(validationIssues, 'warning', 'no-income', 'ยังไม่มีรายการรายได้ ระบบยังไม่สามารถเตรียมชุดยื่นภาษีได้ครบ', 'เพิ่มรายได้อย่างน้อย 1 รายการ')
  }
  if (state.taxFiling.profile.residency === 'non_resident') {
    addIssue(validationIssues, 'warning', 'non-resident-review', 'กรณีผู้ไม่มีถิ่นที่อยู่ในประเทศไทยอาจมีเงื่อนไขภาษีต่างจากบุคคลทั่วไป', 'ให้ผู้เชี่ยวชาญตรวจสถานะภาษีก่อนยื่นจริง')
  }

  const incomeByType = (Object.keys(INCOME_LABELS) as IncomeType[])
    .map((key) => ({ label: INCOME_LABELS[key], amount: round(incomeByTypeMap[key]) }))
    .filter((line) => line.amount > 0)

  for (const line of incomeByType) {
    addTrace(trace, {
      id: `income-${line.label}`,
      label: line.label,
      amount: line.amount,
      formula: 'รายได้ต่อเดือน x 12 จากรายการที่บันทึก',
      sourceUrl: 'https://www.rd.go.th/68191.html',
      inputRefs: ['incomes'],
      kind: 'income',
    })
  }

  const expenses = calcExpenses(state, incomeByTypeMap, trace, validationIssues)
  const deductions = calcDeductions(state, ann, expenses.total, trace, validationIssues)
  const net = Math.max(0, ann - expenses.total - deductions.total)
  const bracketResult = calcTaxByBrackets(net, trace)

  if (withholdingFromIncome > 0) {
    addTrace(trace, {
      id: 'credit-withholding',
      label: 'เครดิตภาษีหัก ณ ที่จ่าย',
      amount: withholdingFromIncome,
      formula: 'ภาษีหัก ณ ที่จ่ายต่อเดือน x 12 จากรายการรายได้',
      sourceUrl: 'https://www.rd.go.th/68191.html',
      inputRefs: ['incomes.wht'],
      kind: 'credit',
    })
  }

  for (const credit of state.taxFiling.credits) {
    addTrace(trace, {
      id: `credit-${credit.id}`,
      label: credit.label,
      amount: credit.amount,
      formula: `เครดิตภาษีประเภท ${credit.type} ที่กรอกจากเอกสาร`,
      sourceUrl: credit.source || 'https://www.rd.go.th/557.html',
      inputRefs: [`taxFiling.credits.${credit.id}`],
      kind: 'credit',
    })
    if (!credit.source) {
      addIssue(validationIssues, 'info', `credit-source-${credit.id}`, `${credit.label} ยังไม่มี source/เลขอ้างอิงเอกสาร`, 'ใส่เลขที่เอกสารหรือหมายเหตุเพื่อใช้ตรวจตอนยื่นจริง')
    }
  }

  const taxPayable = Math.max(0, bracketResult.taxBeforeCredits - withholdingCredit)
  const refund = Math.max(0, withholdingCredit - bracketResult.taxBeforeCredits)
  const { forms, hint } = inferFilingForms(state)
  const documentRequirements = buildDocumentRequirements(state, forms)

  const warnings = validationIssues.map((issue) => issue.message)

  return {
    taxYear: TAX_YEAR,
    ruleVersion: RULE_VERSION,
    ann,
    net,
    tax: bracketResult.taxBeforeCredits,
    taxBeforeCredits: bracketResult.taxBeforeCredits,
    withholdingCredit,
    taxPayable,
    refund,
    mg: bracketResult.mg,
    bd: bracketResult.bd,
    exd: expenses.total,
    tot: deductions.total,
    incomeByType,
    expenseByType: expenses.lines,
    deductionBreakdown: deductions.lines,
    warnings,
    sourceUrls: SOURCE_URLS,
    formHint: hint,
    filingForms: forms,
    validationIssues,
    trace,
    documentRequirements,
    rmfR: Math.max(0, Math.min(ann * 0.3, 500000) - (state.ded.rmf || 0)),
    ssfR: Math.max(0, Math.min(ann * 0.3, 200000) - (state.ded.ssf || 0)),
    esgR: Math.max(0, Math.min(ann * 0.3, 300000) - (state.ded.thaiEsg || 0)),
  }
}

export function buildFilingPackage(state: AppState): FilingPackage {
  const tax = calcTax(state)
  return {
    generatedAt: new Date().toISOString(),
    taxYear: tax.taxYear,
    ruleVersion: tax.ruleVersion,
    formHint: `${tax.formHint} (${tax.filingForms.join(' / ')})`,
    summary: {
      ann: tax.ann,
      exd: tax.exd,
      tot: tax.tot,
      net: tax.net,
      taxBeforeCredits: tax.taxBeforeCredits,
      withholdingCredit: tax.withholdingCredit,
      taxPayable: tax.taxPayable,
      refund: tax.refund,
    },
    validationIssues: tax.validationIssues,
    documentRequirements: tax.documentRequirements,
    trace: tax.trace,
    sourceUrls: tax.sourceUrls,
  }
}
