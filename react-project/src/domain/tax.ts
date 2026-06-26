import type { AppState, IncomeType, TaxEstimate, TaxLineItem } from '../types'

const TAX_YEAR = 2569
const RULE_VERSION = 'TH-PIT-2569-estimator-2026-06-27'

const SOURCE_URLS = [
  'https://www.rd.go.th/556.html',
  'https://www.rd.go.th/557.html',
  'https://www.rd.go.th/59670.html',
  'https://www.rd.go.th/68191.html',
]

const INCOME_LABELS: Record<IncomeType, string> = {
  '40_1': 'ม.40(1) เงินเดือน',
  '40_2': 'ม.40(2) ค่าจ้าง/รับทำงานให้',
  '40_3': 'ม.40(3) ค่าลิขสิทธิ์',
  '40_4': 'ม.40(4) ดอกเบี้ย/เงินปันผล',
  '40_5': 'ม.40(5) ให้เช่าทรัพย์สิน',
  '40_6': 'ม.40(6) วิชาชีพอิสระ',
  '40_7': 'ม.40(7) รับเหมาที่จัดหาสัมภาระ',
  '40_8': 'ม.40(8) ธุรกิจ/พาณิชย์/อื่นๆ',
}

const BRACKETS = [
  { m: 150000, r: 0 },
  { m: 150000, r: 0.05 },
  { m: 200000, r: 0.1 },
  { m: 250000, r: 0.15 },
  { m: 250000, r: 0.2 },
  { m: 1000000, r: 0.25 },
  { m: 3000000, r: 0.3 },
  { m: Infinity, r: 0.35 },
]

function cap(value: number, max: number): number {
  return Math.max(0, Math.min(value || 0, max))
}

function addLine(lines: TaxLineItem[], label: string, amount: number) {
  if (amount > 0) lines.push({ label, amount: Math.round(amount) })
}

function sumByIncomeType(state: AppState): Record<IncomeType, number> {
  const incomeByType = Object.fromEntries(
    Object.keys(INCOME_LABELS).map((key) => [key, 0]),
  ) as Record<IncomeType, number>

  for (const item of state.incomes) {
    incomeByType[item.tp] += item.a * 12
  }

  return incomeByType
}

function calcExpenses(incomeByType: Record<IncomeType, number>) {
  const lines: TaxLineItem[] = []
  const warnings: string[] = []

  const salaryService = incomeByType['40_1'] + incomeByType['40_2']
  const salaryExpense = cap(salaryService * 0.5, 100000)
  addLine(lines, 'ค่าใช้จ่าย ม.40(1)-(2) 50% ไม่เกิน 100,000', salaryExpense)

  const royaltyExpense = cap(incomeByType['40_3'] * 0.5, 100000)
  addLine(lines, 'ค่าใช้จ่าย ม.40(3) แบบเหมา 50% ไม่เกิน 100,000', royaltyExpense)

  if (incomeByType['40_5'] > 0 || incomeByType['40_6'] > 0 || incomeByType['40_7'] > 0 || incomeByType['40_8'] > 0) {
    warnings.push('เงินได้ ม.40(5)-(8) มีวิธีหักค่าใช้จ่ายหลายแบบตามประเภทย่อย ระบบนี้ยังใช้ค่าใช้จ่าย 0 สำหรับส่วนนี้เพื่อไม่ประเมินเกินจริง')
  }

  return {
    total: Math.round(lines.reduce((sum, line) => sum + line.amount, 0)),
    lines,
    warnings,
  }
}

function calcTaxByBrackets(net: number): Pick<TaxEstimate, 'bd' | 'mg' | 'taxBeforeCredits'> {
  let rem = net
  let taxBeforeCredits = 0
  let mg = 0
  const bd: TaxEstimate['bd'] = []

  for (const bracket of BRACKETS) {
    const taxable = bracket.m === Infinity ? rem : Math.min(rem, bracket.m)
    const bracketTax = Math.round(taxable * bracket.r)
    if (taxable > 0 && bracket.r > 0) mg = bracket.r * 100
    taxBeforeCredits += bracketTax
    bd.push({ rate: bracket.r * 100, tax: bracketTax, txbl: Math.round(taxable) })
    rem -= taxable
    if (rem <= 0) break
  }

  return { bd, mg, taxBeforeCredits }
}

export function calcTax(state: AppState): TaxEstimate {
  const incomeByTypeMap = sumByIncomeType(state)
  const ann = Math.round(Object.values(incomeByTypeMap).reduce((sum, value) => sum + value, 0))
  const withholdingCredit = Math.round(state.incomes.reduce((sum, item) => sum + (item.wht || 0) * 12, 0))
  const incomeByType = (Object.keys(INCOME_LABELS) as IncomeType[])
    .map((key) => ({ label: INCOME_LABELS[key], amount: Math.round(incomeByTypeMap[key]) }))
    .filter((line) => line.amount > 0)

  const expenses = calcExpenses(incomeByTypeMap)
  const deductions = state.ded
  const deductionBreakdown: TaxLineItem[] = []

  const personal = cap(deductions.personal || 60000, 60000)
  const spouse = cap(deductions.spouse, 60000)
  const children = cap(deductions.children * 30000, 30000 * 20)
  const parents = cap(deductions.parents * 30000, 120000)
  const disabled = cap(deductions.disabled * 60000, 60000 * 20)
  const maternity = cap(deductions.maternity, 60000)
  const sso = cap(deductions.sso, 9000)
  const lifeHealth = cap(deductions.lifeIns + cap(deductions.healthIns, 25000), 100000)
  const parentHealth = cap(deductions.parentHealthIns, 15000)
  const pensionLife = cap(deductions.pensionLifeIns, Math.min(ann * 0.15, 200000))
  const retirementFunds = cap(
    deductions.pvd + deductions.gpf + deductions.teacherFund + deductions.nssf + deductions.rmf + deductions.ssf,
    500000,
  )
  const thaiEsg = cap(deductions.thaiEsg, Math.min(ann * 0.3, 300000))
  const thaiEsgX = cap(deductions.thaiEsgX, Math.min(ann * 0.3, 300000))
  const homeLoan = cap(deductions.homeLoan, 100000)
  const socialEnterprise = cap(deductions.socialEnterprise, 100000)
  const easyReceipt = cap(deductions.easyReceipt, 50000)

  addLine(deductionBreakdown, 'ค่าลดหย่อนส่วนตัว', personal)
  addLine(deductionBreakdown, 'คู่สมรส', spouse)
  addLine(deductionBreakdown, 'บุตร', children)
  addLine(deductionBreakdown, 'บิดามารดา', parents)
  addLine(deductionBreakdown, 'ผู้พิการ/ทุพพลภาพ', disabled)
  addLine(deductionBreakdown, 'ฝากครรภ์และคลอดบุตร', maternity)
  addLine(deductionBreakdown, 'ประกันสังคม', sso)
  addLine(deductionBreakdown, 'ประกันชีวิตและสุขภาพตนเอง', lifeHealth)
  addLine(deductionBreakdown, 'ประกันสุขภาพบิดามารดา', parentHealth)
  addLine(deductionBreakdown, 'ประกันชีวิตแบบบำนาญ', pensionLife)
  addLine(deductionBreakdown, 'กลุ่มกองทุนเกษียณ PVD/RMF/SSF/กบข./กอช.', retirementFunds)
  addLine(deductionBreakdown, 'Thai ESG', thaiEsg)
  addLine(deductionBreakdown, 'Thai ESGX', thaiEsgX)
  addLine(deductionBreakdown, 'ดอกเบี้ยกู้ซื้อที่อยู่อาศัย', homeLoan)
  addLine(deductionBreakdown, 'ลงทุนวิสาหกิจเพื่อสังคม', socialEnterprise)
  addLine(deductionBreakdown, 'Easy E-Receipt', easyReceipt)

  const preDonationDeductions = deductionBreakdown.reduce((sum, line) => sum + line.amount, 0)
  const preDonationNet = Math.max(0, ann - expenses.total - preDonationDeductions)
  const educationDonation = cap(deductions.educationDonation * 2, preDonationNet * 0.1)
  const generalDonation = cap(deductions.generalDonation, preDonationNet * 0.1)
  addLine(deductionBreakdown, 'บริจาคการศึกษา/กีฬา/สาธารณประโยชน์', educationDonation)
  addLine(deductionBreakdown, 'บริจาคทั่วไป', generalDonation)

  const tot = Math.round(deductionBreakdown.reduce((sum, line) => sum + line.amount, 0))
  const net = Math.max(0, ann - expenses.total - tot)
  const bracketResult = calcTaxByBrackets(net)
  const taxPayable = Math.max(0, bracketResult.taxBeforeCredits - withholdingCredit)
  const refund = Math.max(0, withholdingCredit - bracketResult.taxBeforeCredits)

  const activeTypes = new Set(state.incomes.map((item) => item.tp))
  const formHint = activeTypes.size === 1 && activeTypes.has('40_1')
    ? 'โดยทั่วไปใช้ ภ.ง.ด.91 สำหรับเงินเดือนอย่างเดียว'
    : 'โดยทั่วไปใช้ ภ.ง.ด.90 เมื่อมีเงินได้ประเภทอื่นร่วมด้วย'

  const warnings = [
    ...expenses.warnings,
    'ยังไม่รองรับเครดิตภาษีเงินปันผล, ภาษีครึ่งปี ภ.ง.ด.94, เงื่อนไขถือครองกองทุน, และเอกสารแนบเฉพาะกรณี',
    'รายการลดหย่อนบางประเภทมีเงื่อนไขคุณสมบัติและเอกสารประกอบ ต้องตรวจจากเอกสารกรมสรรพากรก่อนยื่นจริง',
  ]

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
    tot,
    incomeByType,
    expenseByType: expenses.lines,
    deductionBreakdown,
    warnings,
    sourceUrls: SOURCE_URLS,
    formHint,
    rmfR: Math.max(0, Math.min(ann * 0.3, 500000) - (deductions.rmf || 0)),
    ssfR: Math.max(0, Math.min(ann * 0.3, 200000) - (deductions.ssf || 0)),
    esgR: Math.max(0, Math.min(ann * 0.3, 300000) - (deductions.thaiEsg || 0)),
  }
}
