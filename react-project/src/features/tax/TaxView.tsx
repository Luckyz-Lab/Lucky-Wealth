import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { AppState, Deductions, ExpenseMethodType, Income, IncomeType, TaxCreditType, ViewId } from '../../types'
import type { WealthActions } from '../../hooks/usePersistentWealthState'
import { fmt, pct } from '../../domain/format'
import { buildFilingPackage, calcTax, INCOME_LABELS, TH_2569_RULE_SET } from '../../domain/tax'
import { Badge, Button, Card, DataTable, Input, Methodology, MetricCard, ProgressBar, RelatedTools, Select, Tabs } from '../../components/ui'
import { PageHeader } from '../../components/layout'

interface Props {
  state: AppState
  actions: WealthActions
  onNavigate: (view: ViewId) => void
}

type TaxMode = 'quick' | 'prep' | 'review'

const INCOME_TYPE_OPTIONS: { value: Income['tp']; label: string }[] = (Object.keys(INCOME_LABELS) as IncomeType[])
  .map((value) => ({ value, label: INCOME_LABELS[value] }))

const EXPENSE_RATE_PRESETS: Record<IncomeType, { label: string; rate: number; subtype: string }[]> = {
  '40_1': [],
  '40_2': [],
  '40_3': [],
  '40_4': [],
  '40_5': [
    { label: 'บ้าน/อาคาร/ยานพาหนะ 30%', rate: 30, subtype: 'ให้เช่าบ้าน อาคาร หรือยานพาหนะ' },
    { label: 'ที่ดินเกษตร 20%', rate: 20, subtype: 'ให้เช่าที่ดินเพื่อเกษตรกรรม' },
    { label: 'ทรัพย์สินอื่น 10%', rate: 10, subtype: 'ให้เช่าทรัพย์สินอื่น' },
  ],
  '40_6': [
    { label: 'วิชาชีพทั่วไป 30%', rate: 30, subtype: 'วิชาชีพอิสระทั่วไป' },
    { label: 'ประกอบโรคศิลปะ 60%', rate: 60, subtype: 'ประกอบโรคศิลปะ' },
  ],
  '40_7': [
    { label: 'รับเหมาพร้อมสัมภาระ 60%', rate: 60, subtype: 'รับเหมาที่จัดหาสัมภาระ' },
  ],
  '40_8': [
    { label: 'ธุรกิจกลุ่ม 40%', rate: 40, subtype: 'ธุรกิจที่กฎหมายให้หักเหมา 40%' },
    { label: 'ธุรกิจกลุ่ม 60%', rate: 60, subtype: 'ธุรกิจที่กฎหมายให้หักเหมา 60%' },
    { label: 'ธุรกิจกลุ่ม 80%', rate: 80, subtype: 'ธุรกิจที่กฎหมายให้หักเหมา 80%' },
  ],
}

const DED_ITEMS: {
  key: keyof Deductions
  label: string
  max: number
  type: 'money' | 'count'
  locked?: boolean
  info: string
}[] = [
  { key: 'personal', label: 'ค่าลดหย่อนส่วนตัว', max: 60000, type: 'money', locked: true, info: 'สิทธิพื้นฐานของผู้มีเงินได้ ระบบล็อกไว้ที่ 60,000 บาท' },
  { key: 'spouse', label: 'คู่สมรสไม่มีเงินได้', max: 60000, type: 'money', info: 'ใช้เมื่อคู่สมรสไม่มีเงินได้และเข้าเงื่อนไขตามกฎหมายภาษี' },
  { key: 'children', label: 'บุตร (จำนวนคน)', max: 20, type: 'count', info: 'กรอกจำนวนบุตรที่เข้าเงื่อนไข ระบบคำนวณ 30,000 บาทต่อคน' },
  { key: 'parents', label: 'บิดามารดา (จำนวนคน)', max: 4, type: 'count', info: 'กรอกจำนวนบิดามารดาที่เข้าเงื่อนไข สูงสุด 4 คน' },
  { key: 'disabled', label: 'ผู้พิการ/ทุพพลภาพ (จำนวนคน)', max: 20, type: 'count', info: 'กรอกจำนวนผู้พิการหรือทุพพลภาพที่อุปการะและมีเอกสารรับรอง' },
  { key: 'maternity', label: 'ฝากครรภ์และคลอดบุตร', max: 60000, type: 'money', info: 'กรอกยอดค่าใช้จ่ายจริงตามใบเสร็จ ไม่เกิน 60,000 บาท' },
  { key: 'sso', label: 'ประกันสังคม', max: 9000, type: 'money', info: 'กรอกเงินสมทบประกันสังคมทั้งปี ตามใบรับรองหรือสลิปเงินเดือน' },
  { key: 'lifeIns', label: 'ประกันชีวิต', max: 100000, type: 'money', info: 'กรอกเบี้ยประกันชีวิตที่มีหนังสือรับรองลดหย่อน' },
  { key: 'healthIns', label: 'ประกันสุขภาพตนเอง', max: 25000, type: 'money', info: 'กรอกเบี้ยประกันสุขภาพตนเอง ระบบรวมกับประกันชีวิตภายใต้เพดานหลัก' },
  { key: 'parentHealthIns', label: 'ประกันสุขภาพบิดามารดา', max: 15000, type: 'money', info: 'กรอกเบี้ยประกันสุขภาพพ่อแม่ที่เข้าเงื่อนไข' },
  { key: 'pensionLifeIns', label: 'ประกันชีวิตแบบบำนาญ', max: 200000, type: 'money', info: 'กรอกเบี้ยประกันบำนาญ ระบบรวมในเพดานกลุ่มเกษียณ 500,000 บาท' },
  { key: 'pvd', label: 'กองทุนสำรองเลี้ยงชีพ PVD', max: 500000, type: 'money', info: 'กรอกเงินสะสม PVD ทั้งปีจากหนังสือรับรอง' },
  { key: 'gpf', label: 'กบข.', max: 500000, type: 'money', info: 'กรอกเงินสะสม กบข. ถ้ามี' },
  { key: 'teacherFund', label: 'กองทุนสงเคราะห์ครูโรงเรียนเอกชน', max: 500000, type: 'money', info: 'กรอกเงินสะสมกองทุนสงเคราะห์ครูโรงเรียนเอกชนถ้ามี' },
  { key: 'nssf', label: 'กอช.', max: 30000, type: 'money', info: 'กรอกเงินสะสมกองทุนการออมแห่งชาติถ้ามี' },
  { key: 'rmf', label: 'RMF', max: 500000, type: 'money', info: 'กรอกยอดซื้อ RMF ทั้งปี ต้องตรวจเงื่อนไขการถือครองก่อนยื่นจริง' },
  { key: 'ssf', label: 'SSF', max: 200000, type: 'money', info: 'กรอกยอดซื้อ SSF ทั้งปี ต้องตรวจเงื่อนไขกองทุนและเพดานรวม' },
  { key: 'thaiEsg', label: 'Thai ESG', max: 300000, type: 'money', info: 'กรอกยอดซื้อ Thai ESG ที่มีหนังสือรับรอง' },
  { key: 'thaiEsgX', label: 'Thai ESGX', max: 300000, type: 'money', info: 'กรอกยอด Thai ESGX ถ้ามี ต้องตรวจประกาศปีภาษีนั้นอีกครั้ง' },
  { key: 'homeLoan', label: 'ดอกเบี้ยกู้บ้าน', max: 100000, type: 'money', info: 'กรอกเฉพาะดอกเบี้ยกู้ซื้อที่อยู่อาศัยทั้งปี ไม่ใช่ยอดผ่อนทั้งหมด' },
  { key: 'educationDonation', label: 'บริจาคการศึกษา/กีฬา', max: 1000000, type: 'money', info: 'กรอกยอดบริจาคจริง ระบบคำนวณแบบสองเท่าภายใต้เพดาน' },
  { key: 'generalDonation', label: 'บริจาคทั่วไป', max: 1000000, type: 'money', info: 'กรอกยอดบริจาคทั่วไปที่มีหลักฐานหรือ e-Donation' },
  { key: 'socialEnterprise', label: 'ลงทุนวิสาหกิจเพื่อสังคม', max: 100000, type: 'money', info: 'กรอกยอดลงทุนที่เข้าเงื่อนไขลดหย่อน' },
  { key: 'easyReceipt', label: 'Easy E-Receipt', max: 50000, type: 'money', info: 'กรอกยอดใช้จ่ายตามมาตรการและช่วงเวลาที่ประกาศสำหรับปีภาษีนั้น' },
]

function parseMoney(value: string): number {
  return Number(value.replace(/,/g, '')) || 0
}

function moneyInput(value: number): string {
  return value > 0 ? fmt(value) : ''
}

function formatMoneyText(value: string): string {
  const raw = value.replace(/[^\d.]/g, '')
  if (!raw) return ''
  const [whole, decimal] = raw.split('.')
  const formattedWhole = fmt(Number(whole) || 0)
  return decimal !== undefined ? `${formattedWhole}.${decimal.slice(0, 2)}` : formattedWhole
}

function issueTone(severity: string): 'good' | 'warn' | 'bad' | 'info' {
  if (severity === 'error') return 'bad'
  if (severity === 'warning') return 'warn'
  return 'info'
}

export function TaxView({ state, actions, onNavigate }: Props) {
  const [mode, setMode] = useState<TaxMode>('prep')
  const [incomeTitle, setIncomeTitle] = useState('เงินเดือน')
  const [annualIncomeAmount, setAnnualIncomeAmount] = useState('')
  const [annualWht, setAnnualWht] = useState('')
  const [incomeType, setIncomeType] = useState<Income['tp']>('40_1')
  const [expenseIncomeType, setExpenseIncomeType] = useState<IncomeType>('40_5')
  const [expenseMethod, setExpenseMethod] = useState<ExpenseMethodType>('standard')
  const [expenseSubtype, setExpenseSubtype] = useState(EXPENSE_RATE_PRESETS['40_5'][0].subtype)
  const [expenseRate, setExpenseRate] = useState('30')
  const [actualExpense, setActualExpense] = useState('')
  const [creditLabel, setCreditLabel] = useState('เครดิตภาษีเงินปันผล')
  const [creditType, setCreditType] = useState<TaxCreditType>('dividend')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditSource, setCreditSource] = useState('')

  const tax = calcTax(state)
  const filingPackage = useMemo(() => buildFilingPackage(state), [state])
  const marginalTone = tax.mg <= 10 ? 'good' : tax.mg <= 25 ? 'warn' : 'bad'
  const blockingIssues = tax.validationIssues.filter((issue) => issue.severity === 'error')
  const warningIssues = tax.validationIssues.filter((issue) => issue.severity === 'warning')

  const addIncome = () => {
    const annualAmount = parseMoney(annualIncomeAmount)
    if (!incomeTitle.trim() || annualAmount <= 0) return
    actions.addIncome({
      t: incomeTitle.trim(),
      a: Math.round(annualAmount / 12),
      wht: Math.round(parseMoney(annualWht) / 12),
      tp: incomeType,
    })
    setIncomeTitle('')
    setAnnualIncomeAmount('')
    setAnnualWht('')
  }

  const applySalaryPreset = (annualAmount: number) => {
    setIncomeTitle('เงินเดือน')
    setIncomeType('40_1')
    setAnnualIncomeAmount(moneyInput(annualAmount))
  }

  const applyExpensePreset = (incomeTypeValue: IncomeType, rate: number, subtype: string) => {
    setExpenseIncomeType(incomeTypeValue)
    setExpenseMethod('standard')
    setExpenseRate(String(rate))
    setExpenseSubtype(subtype)
  }

  const addExpenseMethod = () => {
    actions.addExpenseMethod({
      incomeType: expenseIncomeType,
      method: expenseMethod,
      subtype: expenseSubtype.trim() || INCOME_LABELS[expenseIncomeType],
      standardRate: Number(expenseRate) || 0,
      actualAmount: parseMoney(actualExpense),
    })
    setActualExpense('')
  }

  const addCredit = () => {
    const amount = parseMoney(creditAmount)
    if (!creditLabel.trim() || amount <= 0) return
    actions.addTaxCredit({
      label: creditLabel.trim(),
      type: creditType,
      amount,
      source: creditSource.trim() || undefined,
    })
    setCreditAmount('')
    setCreditSource('')
  }

  const exportPackage = () => {
    const blob = new Blob([JSON.stringify(filingPackage, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `lucky-wealth-tax-${tax.taxYear}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        eyebrow="Thai PIT filing prep"
        title="เตรียมคำนวณภาษีเงินได้บุคคลธรรมดา"
        description="กรอกข้อมูลตามขั้นตอน ตรวจสิทธิ ค่าใช้จ่าย เครดิตภาษี และเอกสารประกอบก่อนนำข้อมูลไปยื่นจริง ระบบนี้ไม่ส่งข้อมูลเข้า e-Filing แทนผู้ใช้"
        meta={`ปีภาษี ${tax.taxYear} · ${tax.ruleVersion}`}
      />

      <div className="notice notice--warn">
        <i aria-hidden="true" className="ti ti-alert-triangle" />
        <div>
          <strong>ใช้เป็น filing preparation ไม่ใช่คำรับรองทางกฎหมาย</strong>
          <p>{tax.formHint} · ก่อนยื่นจริงต้องตรวจเอกสาร รายการลดหย่อน และประกาศกรมสรรพากรของปีภาษีนั้น</p>
        </div>
      </div>

      <Tabs
        value={mode}
        onChange={setMode}
        items={[
          { id: 'quick', label: 'Quick Estimate' },
          { id: 'prep', label: 'Filing Prep' },
          { id: 'review', label: 'Review & Export' },
        ]}
      />

      <section className="tax-result-first">
        <Card title={tax.refund > 0 ? 'คาดว่าขอคืนได้' : 'คาดว่าต้องชำระเพิ่ม'} eyebrow="Result first" tone="highlight">
          <div className="summary-hero">
            <span>{tax.refund > 0 ? 'ยอดคืนภาษีโดยประมาณ' : 'ยอดชำระเพิ่มโดยประมาณ'}</span>
            <strong>฿{fmt(tax.refund > 0 ? tax.refund : tax.taxPayable)}</strong>
            <small>ภาษีก่อนเครดิต ฿{fmt(tax.taxBeforeCredits)} · เครดิต/หัก ณ ที่จ่าย ฿{fmt(tax.withholdingCredit)}</small>
          </div>
        </Card>
        <MetricCard label="รายได้ทั้งปี" value={`฿${fmt(tax.ann)}`} tone="info" note={`${state.incomes.length} รายการรายได้`} />
        <MetricCard label="รายได้สุทธิ" value={`฿${fmt(tax.net)}`} tone="good" note={`หักค่าใช้จ่าย ฿${fmt(tax.exd)} และลดหย่อน ฿${fmt(tax.tot)}`} />
        <MetricCard label="Marginal rate" value={`${tax.mg}%`} tone={marginalTone} note={<Badge tone={marginalTone}>อัตราสูงสุด</Badge>} />
      </section>

      {mode === 'quick' && (
        <div className="content-grid content-grid--balanced">
          <Card title="Quick Estimate" eyebrow="Fast entry">
            <p className="section-copy">กรอกรายได้ต่อปีและภาษีหัก ณ ที่จ่ายเพื่อดูผลทันที เหมาะสำหรับวางแผนก่อนเตรียมเอกสารเต็มชุด</p>
            <div className="preset-row">
              {[360000, 600000, 900000, 1200000, 1800000].map((amount) => (
                <button key={amount} type="button" className="chip" onClick={() => applySalaryPreset(amount)}>รายได้ ฿{fmt(amount)}</button>
              ))}
            </div>
            <div className="form-grid form-grid--4">
              <Input label="ชื่อรายได้" value={incomeTitle} onChange={(event) => setIncomeTitle(event.target.value)} placeholder="เช่น เงินเดือน, ฟรีแลนซ์" info="ใช้แยกรายการรายได้ในตารางและ calculation trace" />
              <Input label="รายได้ต่อปี" inputMode="decimal" value={annualIncomeAmount} onChange={(event) => setAnnualIncomeAmount(formatMoneyText(event.target.value))} placeholder="600,000" info="กรอกยอดก่อนหักภาษีทั้งปี เช่น เงินเดือน 50,000 บาทต่อเดือน ให้กรอก 600,000" />
              <Input label="หัก ณ ที่จ่ายต่อปี" inputMode="decimal" value={annualWht} onChange={(event) => setAnnualWht(formatMoneyText(event.target.value))} placeholder="0" info="กรอกภาษีที่ถูกหักไว้ทั้งปีจากใบ 50 ทวิหรือสลิปเงินเดือน" />
              <Button icon="ti-plus" onClick={addIncome}>เพิ่มรายได้</Button>
            </div>
          </Card>

          <Card title="ผลลัพธ์หลัก" eyebrow="Summary">
            <div className="summary-list">
              <div><span>แบบที่น่าจะใช้</span><strong>{tax.filingForms.join(' / ')}</strong></div>
              <div><span>ค่าใช้จ่ายที่หักได้</span><strong>฿{fmt(tax.exd)}</strong></div>
              <div><span>ลดหย่อนรวม</span><strong>฿{fmt(tax.tot)}</strong></div>
              <div><span>Effective rate</span><strong>{tax.ann > 0 ? ((tax.taxBeforeCredits / tax.ann) * 100).toFixed(2) : '0.00'}%</strong></div>
            </div>
            <div className="stack">
              <ProgressBar label="ค่าใช้จ่าย" valueLabel={`฿${fmt(tax.exd)}`} value={pct(tax.exd, tax.ann)} tone="info" />
              <ProgressBar label="ค่าลดหย่อน" valueLabel={`฿${fmt(tax.tot)}`} value={pct(tax.tot, tax.ann)} tone="good" />
            </div>
          </Card>
        </div>
      )}

      {mode === 'prep' && (
        <div className="tax-workspace tax-workspace--wide">
          <div className="tax-steps">
            <div className="filing-stepper" aria-label="ขั้นตอนเตรียมยื่นภาษี">
              {[
                ['1', 'Profile', 'ปีภาษีและสถานะ'],
                ['2', 'Income', `${state.incomes.length} รายการ`],
                ['3', 'Expenses', `${state.taxFiling.expenseMethods.length} วิธี`],
                ['4', 'Deductions', `ลดหย่อน ฿${fmt(tax.tot)}`],
                ['5', 'Review', `${warningIssues.length} warnings`],
              ].map(([no, title, detail]) => (
                <div key={no} className="filing-step">
                  <span>{no}</span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </div>
              ))}
            </div>

            <Card title="1. Profile" eyebrow="Taxpayer">
              <div className="form-grid form-grid--4">
                <Input label="ปีภาษี" inputMode="numeric" value={state.taxFiling.profile.taxYear} onChange={(event) => actions.updateTaxProfile({ taxYear: Number(event.target.value) || 2569 })} info="ปีภาษีที่ใช้ rule set ปัจจุบันคือ 2569 หากเปลี่ยนปีต้องอัปเดตกฎภาษีให้ตรงปีนั้น" />
                <Select label="ถิ่นที่อยู่ทางภาษี" value={state.taxFiling.profile.residency} onChange={(event) => actions.updateTaxProfile({ residency: event.target.value as AppState['taxFiling']['profile']['residency'] })} info="โดยทั่วไปผู้มีถิ่นที่อยู่ในประเทศไทยมีเงื่อนไขภาษีต่างจาก non-resident">
                  <option value="resident">มีถิ่นที่อยู่ในประเทศไทย</option>
                  <option value="non_resident">ไม่มีถิ่นที่อยู่ในประเทศไทย</option>
                </Select>
                <Select label="สถานะการยื่น" value={state.taxFiling.profile.filingStatus} onChange={(event) => actions.updateTaxProfile({ filingStatus: event.target.value as AppState['taxFiling']['profile']['filingStatus'] })} info="ใช้ช่วยตรวจค่าลดหย่อนคู่สมรสและข้อความเตือน">
                  <option value="single">โสด / ยื่นคนเดียว</option>
                  <option value="married_separate">สมรส แยกยื่น</option>
                  <option value="married_joint">สมรส รวมยื่น</option>
                </Select>
                <Select label="คู่สมรสมีเงินได้หรือไม่" value={state.taxFiling.profile.spouseHasIncome ? 'yes' : 'no'} onChange={(event) => actions.updateTaxProfile({ spouseHasIncome: event.target.value === 'yes' })} info="ถ้าคู่สมรสมีเงินได้ อาจไม่มีสิทธิลดหย่อนคู่สมรส 60,000 บาท">
                  <option value="no">ไม่มีเงินได้</option>
                  <option value="yes">มีเงินได้</option>
                </Select>
              </div>
            </Card>

            <Card title="2. Income" eyebrow="PND90 / PND91 / PND94">
              <p className="section-copy">กรอกเป็นยอดต่อปี ระบบจะแปลงเก็บเป็นรายเดือนเพื่อให้ข้อมูลยังใช้ร่วมกับเครื่องมืออื่นได้</p>
              <div className="form-grid form-grid--5">
                <Input label="ชื่อรายได้" value={incomeTitle} onChange={(event) => setIncomeTitle(event.target.value)} placeholder="เช่น เงินเดือน, ค่าจ้าง, เงินปันผล" info="ใช้เป็นชื่อแสดงในตารางและ export package" />
                <Input label="รายได้ต่อปี" inputMode="decimal" value={annualIncomeAmount} onChange={(event) => setAnnualIncomeAmount(formatMoneyText(event.target.value))} placeholder="600,000" info="กรอกยอดรายได้ก่อนหักภาษีทั้งปี" />
                <Input label="หัก ณ ที่จ่ายต่อปี" inputMode="decimal" value={annualWht} onChange={(event) => setAnnualWht(formatMoneyText(event.target.value))} placeholder="0" info="กรอกภาษีที่ถูกหักไว้ทั้งปีจากเอกสาร 50 ทวิหรือหนังสือรับรอง" />
                <Select label="ประเภทเงินได้" value={incomeType} onChange={(event) => setIncomeType(event.target.value as Income['tp'])} info="ประเภทเงินได้ตามมาตรา 40 มีผลต่อแบบยื่นและวิธีหักค่าใช้จ่าย">
                  {INCOME_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
                <Button icon="ti-plus" onClick={addIncome}>เพิ่มรายได้</Button>
              </div>
              <DataTable headers={['รายการ', 'ประเภท', 'รายได้ต่อปี', 'หัก ณ ที่จ่ายต่อปี', '']}>
                {state.incomes.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.t}</strong></td>
                    <td><Badge tone="info">{item.tp}</Badge></td>
                    <td className="num">฿{fmt(item.a * 12)}</td>
                    <td className="num">฿{fmt((item.wht || 0) * 12)}</td>
                    <td className="action-cell"><Button variant="ghost" icon="ti-trash" onClick={() => actions.removeIncome(item.id)}>ลบ</Button></td>
                  </tr>
                ))}
              </DataTable>
            </Card>

            <Card title="3. Expenses" eyebrow="Expense method">
              <p className="section-copy">เงินได้ ม.40(5)-(8) ต้องเลือกวิธีหักค่าใช้จ่ายตามประเภทย่อย ถ้าไม่เลือก ระบบจะเตือนและใช้ 0 บาทเพื่อไม่หักเกินจริง</p>
              <div className="preset-row">
                {(['40_5', '40_6', '40_7', '40_8'] as IncomeType[]).flatMap((type) => EXPENSE_RATE_PRESETS[type].map((preset) => (
                  <button key={`${type}-${preset.label}`} type="button" className="chip" onClick={() => applyExpensePreset(type, preset.rate, preset.subtype)}>{type} · {preset.label}</button>
                )))}
              </div>
              <div className="form-grid form-grid--5">
                <Select label="เงินได้ที่ใช้วิธีนี้" value={expenseIncomeType} onChange={(event) => setExpenseIncomeType(event.target.value as IncomeType)} info="เลือกประเภทเงินได้ที่ต้องกำหนดวิธีหักค่าใช้จ่ายเพิ่มเติม">
                  {(['40_5', '40_6', '40_7', '40_8'] as IncomeType[]).map((type) => <option key={type} value={type}>{INCOME_LABELS[type]}</option>)}
                </Select>
                <Select label="วิธีหักค่าใช้จ่าย" value={expenseMethod} onChange={(event) => setExpenseMethod(event.target.value as ExpenseMethodType)} info="แบบเหมาใช้อัตราตามตารางกรมสรรพากร แบบตามจริงต้องมีเอกสารค่าใช้จ่าย">
                  <option value="standard">แบบเหมา</option>
                  <option value="actual">ตามจริง</option>
                </Select>
                <Input label="ประเภทย่อย" value={expenseSubtype} onChange={(event) => setExpenseSubtype(event.target.value)} placeholder="เช่น ให้เช่าอาคาร" info="ระบุประเภทย่อยเพื่อใช้ตรวจว่าหักเหมาอัตรานี้ได้จริง" />
                <Input label={expenseMethod === 'standard' ? 'อัตราเหมา %' : 'ค่าใช้จ่ายจริง'} inputMode="decimal" value={expenseMethod === 'standard' ? expenseRate : actualExpense} onChange={(event) => expenseMethod === 'standard' ? setExpenseRate(event.target.value) : setActualExpense(formatMoneyText(event.target.value))} info={expenseMethod === 'standard' ? 'กรอกอัตราเหมา เช่น 30 หรือ 60 ต้องตรงกับตารางค่าใช้จ่าย' : 'กรอกยอดค่าใช้จ่ายจริงทั้งปีที่มีเอกสารรองรับ'} />
                <Button icon="ti-plus" onClick={addExpenseMethod}>บันทึกวิธี</Button>
              </div>
              <DataTable headers={['ประเภทเงินได้', 'วิธี', 'รายละเอียด', 'ค่าใช้จ่าย', '']}>
                {state.taxFiling.expenseMethods.map((item) => (
                  <tr key={item.id}>
                    <td>{item.incomeType}</td>
                    <td><Badge tone={item.method === 'standard' ? 'info' : 'warn'}>{item.method === 'standard' ? `เหมา ${item.standardRate}%` : 'ตามจริง'}</Badge></td>
                    <td>{item.subtype}</td>
                    <td className="num">{item.method === 'actual' ? `฿${fmt(item.actualAmount)}` : '-'}</td>
                    <td className="action-cell"><Button variant="ghost" icon="ti-trash" onClick={() => actions.removeExpenseMethod(item.id)}>ลบ</Button></td>
                  </tr>
                ))}
              </DataTable>
            </Card>

            <Card title="4. Deductions" eyebrow="Eligibility and caps">
              <p className="section-copy">กรอกเฉพาะยอดที่มีเอกสารหรือเข้าเงื่อนไขจริง ช่องจำนวนคนให้กรอกเป็นจำนวนคน ส่วนช่องเงินให้กรอกยอดทั้งปี</p>
              <div className="deduction-grid">
                {DED_ITEMS.map((item) => (
                  <Input
                    key={item.key}
                    label={item.label}
                    inputMode="decimal"
                    value={item.type === 'money' ? moneyInput(state.ded[item.key]) : state.ded[item.key]}
                    readOnly={item.locked}
                    info={item.info}
                    helper={item.locked ? 'ค่าคงที่พื้นฐาน' : item.type === 'money' ? `เพดานทั่วไป ฿${fmt(item.max)}` : `สูงสุด ${item.max} คน`}
                    onChange={(event) => {
                      const next = item.type === 'money' ? parseMoney(event.target.value) : Number(event.target.value) || 0
                      actions.updateDeductions(item.key, next)
                    }}
                  />
                ))}
              </div>
            </Card>

            <Card title="5. Credits" eyebrow="Withholding / dividend / mid-year">
              <div className="form-grid form-grid--5">
                <Input label="ชื่อเครดิตภาษี" value={creditLabel} onChange={(event) => setCreditLabel(event.target.value)} info="เช่น เครดิตภาษีเงินปันผล ภาษีครึ่งปี ภาษีชำระไว้" />
                <Select label="ประเภทเครดิต" value={creditType} onChange={(event) => setCreditType(event.target.value as TaxCreditType)} info="เลือกประเภทเพื่อใช้แสดงใน calculation trace">
                  <option value="dividend">เครดิตภาษีเงินปันผล</option>
                  <option value="midyear">ภาษีครึ่งปี ภ.ง.ด.94</option>
                  <option value="withholding">หัก ณ ที่จ่ายเพิ่มเติม</option>
                  <option value="other">อื่น ๆ</option>
                </Select>
                <Input label="ยอดเครดิต" inputMode="decimal" value={creditAmount} onChange={(event) => setCreditAmount(formatMoneyText(event.target.value))} placeholder="0" info="กรอกยอดเครดิตที่คำนวณหรือระบุจากเอกสาร ไม่ใช่ยอดเงินปันผลรวม" />
                <Input label="เลขอ้างอิง/แหล่งที่มา" value={creditSource} onChange={(event) => setCreditSource(event.target.value)} placeholder="เช่น เลขที่เอกสาร" info="ใช้ตรวจสอบย้อนกลับตอนเตรียมยื่นจริง" />
                <Button icon="ti-plus" onClick={addCredit}>เพิ่มเครดิต</Button>
              </div>
              <DataTable headers={['เครดิต', 'ประเภท', 'ยอด', 'แหล่งที่มา', '']}>
                {state.taxFiling.credits.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.label}</strong></td>
                    <td><Badge tone="info">{item.type}</Badge></td>
                    <td className="num">฿{fmt(item.amount)}</td>
                    <td>{item.source || '-'}</td>
                    <td className="action-cell"><Button variant="ghost" icon="ti-trash" onClick={() => actions.removeTaxCredit(item.id)}>ลบ</Button></td>
                  </tr>
                ))}
              </DataTable>
            </Card>
          </div>

          <aside className="tax-summary" aria-label="สรุปภาษี">
            <Card title="สรุปสด" eyebrow="Live filing check">
              <div className="summary-list">
                <div><span>แบบที่แนะนำ</span><strong>{tax.filingForms.join(' / ')}</strong></div>
                <div><span>รายได้รวม</span><strong>฿{fmt(tax.ann)}</strong></div>
                <div><span>ค่าใช้จ่าย</span><strong>฿{fmt(tax.exd)}</strong></div>
                <div><span>ลดหย่อนรวม</span><strong>฿{fmt(tax.tot)}</strong></div>
                <div><span>ภาษีก่อนเครดิต</span><strong>฿{fmt(tax.taxBeforeCredits)}</strong></div>
                <div><span>เครดิตรวม</span><strong>฿{fmt(tax.withholdingCredit)}</strong></div>
              </div>
              <div className="metric-grid metric-grid--compact">
                <MetricCard label="Errors" value={`${blockingIssues.length}`} tone={blockingIssues.length ? 'bad' : 'good'} note="ต้องแก้ก่อน export" />
                <MetricCard label="Warnings" value={`${warningIssues.length}`} tone={warningIssues.length ? 'warn' : 'good'} note="ต้องตรวจเอกสาร" />
              </div>
            </Card>
          </aside>
        </div>
      )}

      {mode === 'review' && (
        <div className="content-grid">
          <Card title="Review & Export" eyebrow="Filing package" action={<Button icon="ti-download" onClick={exportPackage}>Export JSON</Button>}>
            <div className="review-grid">
              <div className="review-block">
                <span>แบบภาษี</span>
                <strong>{tax.filingForms.join(' / ')}</strong>
                <p>{tax.formHint}</p>
              </div>
              <div className="review-block">
                <span>สถานะตรวจสอบ</span>
                <strong>{blockingIssues.length === 0 ? 'Export ได้' : 'ยังมี error'}</strong>
                <p>{blockingIssues.length} error · {warningIssues.length} warning · trace {tax.trace.length} รายการ</p>
              </div>
              <div className="review-block">
                <span>Rule set</span>
                <strong>{TH_2569_RULE_SET.ruleVersion}</strong>
                <p>ทุก rule มี source URL และ effective date สำหรับตรวจย้อนหลัง</p>
              </div>
            </div>
          </Card>

          <div className="content-grid content-grid--balanced">
            <Card title="Validation" eyebrow="Issues">
              <div className="stack">
                {tax.validationIssues.length === 0 ? (
                  <div className="notice notice--good"><i aria-hidden="true" className="ti ti-circle-check" /><p>ยังไม่พบ warning จากข้อมูลที่กรอก แต่ยังต้องตรวจเอกสารจริงก่อนยื่น</p></div>
                ) : tax.validationIssues.map((issue) => (
                  <div key={`${issue.code}-${issue.message}`} className={`notice notice--${issueTone(issue.severity)}`}>
                    <i aria-hidden="true" className="ti ti-alert-circle" />
                    <div>
                      <strong>{issue.severity.toUpperCase()} · {issue.code}</strong>
                      <p>{issue.message}</p>
                      {issue.action && <p><strong>วิธีแก้:</strong> {issue.action}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Document checklist" eyebrow="Evidence">
              <DataTable headers={['เอกสาร', 'สถานะ', 'ใช้เมื่อ']}>
                {tax.documentRequirements.map((doc) => (
                  <tr key={doc.id}>
                    <td><strong>{doc.label}</strong><p className="table-note">{doc.reason}</p></td>
                    <td><Badge tone={doc.status === 'required' ? 'warn' : doc.status === 'recommended' ? 'info' : 'neutral'}>{doc.status}</Badge></td>
                    <td>{doc.requiredWhen}</td>
                  </tr>
                ))}
              </DataTable>
            </Card>
          </div>

          <div className="content-grid content-grid--balanced">
            <Card title="Calculation trace" eyebrow="Audit trail">
              <DataTable headers={['ขั้นตอน', 'สูตร', 'ยอด']}>
                {tax.trace.map((item) => (
                  <tr key={`${item.id}-${item.label}-${item.amount}`}>
                    <td><strong>{item.label}</strong><p className="table-note">{item.sourceUrl}</p></td>
                    <td>{item.formula}</td>
                    <td className="num">฿{fmt(item.amount)}</td>
                  </tr>
                ))}
              </DataTable>
            </Card>

            <Card title="Official sources" eyebrow="References">
              <div className="source-list">
                {tax.sourceUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">{url}</a>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <div className="content-grid content-grid--balanced">
        <Card title="ฐานคำนวณ" eyebrow="Breakdown">
          <DataTable headers={['รายการ', 'จำนวนเงิน']}>
            <tr><td><strong>รายได้รวมทั้งปี</strong></td><td className="num">฿{fmt(tax.ann)}</td></tr>
            {tax.incomeByType.map((line) => <tr key={line.label}><td>{line.label}</td><td className="num">฿{fmt(line.amount)}</td></tr>)}
            {tax.expenseByType.map((line) => <tr key={line.label}><td>{line.label}</td><td className="num">-฿{fmt(line.amount)}</td></tr>)}
            <tr><td><strong>ลดหย่อนรวม</strong></td><td className="num">-฿{fmt(tax.tot)}</td></tr>
            <tr><td><strong>รายได้สุทธิ</strong></td><td className="num">฿{fmt(tax.net)}</td></tr>
          </DataTable>
        </Card>

        <Card title="ขั้นบันไดภาษี" eyebrow="Brackets">
          <div className="bracket-list">
            {tax.bd.filter((bracket) => bracket.txbl > 0).map((bracket) => (
              <div key={`${bracket.rate}-${bracket.txbl}`} className="bracket">
                <span>{bracket.rate}%</span>
                <div className="bracket__track"><div className="bracket__fill" style={{ '--progress': `${(bracket.rate / 35) * 100}%` } as CSSProperties} /></div>
                <strong>฿{fmt(bracket.tax)}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Methodology
        items={[
          'รวมรายได้ทั้งปีตามประเภทเงินได้ ม.40 แล้วเลือกแบบ ภ.ง.ด.90/91/94 ตามโครงสร้างรายได้',
          'หักค่าใช้จ่ายตาม rule set ปี 2569 โดยเงินได้ ม.40(5)-(8) ต้องเลือกประเภทย่อยหรือใช้ค่าใช้จ่ายตามจริง',
          'หักค่าลดหย่อนและเครดิตภาษีพร้อมเพดานรายรายการ เพดานรวมกลุ่มเกษียณ และ donation cap ก่อนคำนวณภาษีขั้นบันได',
        ]}
        note="ผลลัพธ์ออกแบบเพื่อเตรียมยื่นและตรวจงาน ไม่ใช่การยื่นแทนอัตโนมัติ ต้องใช้เอกสารจริงและประกาศกรมสรรพากรของปีภาษีนั้นประกอบเสมอ"
      />

      <RelatedTools
        onNavigate={onNavigate}
        items={[
          { id: 'vault', title: 'คลังเอกสารภาษี', description: 'เก็บรายการใบ 50 ทวิ ประกัน กองทุน และใบเสร็จที่ต้องใช้ตรวจ', icon: 'ti-folder-check' },
          { id: 'retirement', title: 'วางแผนเกษียณ + DCA', description: 'จำลองการซื้อกองทุนและเงินหลังเกษียณควบคู่กับสิทธิภาษี', icon: 'ti-target-arrow' },
          { id: 'loan', title: 'ผ่อนบ้าน / รถ + โปะ', description: 'ดูดอกเบี้ยบ้านและแผนลดภาระหนี้เพื่อประกอบ planning', icon: 'ti-home-dollar' },
        ]}
      />
    </>
  )
}
