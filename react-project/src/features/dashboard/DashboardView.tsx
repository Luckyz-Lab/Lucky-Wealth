import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { AppState, Asset, Expense, Income, ViewId } from '../../types'
import type { WealthActions } from '../../hooks/usePersistentWealthState'
import { buildHealthMetrics, calcTotals } from '../../domain/finance'
import { fmt, pct } from '../../domain/format'
import { calcTax } from '../../domain/tax'
import { Badge, Button, Card, DataTable, EmptyState, Input, MetricCard, ProgressBar, Select, Tabs } from '../../components/ui'
import { PageHeader } from '../../components/layout'

interface Props {
  state: AppState
  actions: WealthActions
  onNavigate: (view: ViewId) => void
}

type TabId = 'income' | 'expense' | 'asset' | 'debt'

const EXPENSE_LABELS: Record<Expense['c'], string> = {
  food: 'อาหาร',
  housing: 'ที่พัก',
  transport: 'เดินทาง',
  leisure: 'สันทนาการ',
  other: 'อื่นๆ',
}

const EXPENSE_TONES: Record<Expense['c'], 'good' | 'warn' | 'bad' | 'info' | 'neutral'> = {
  food: 'warn',
  housing: 'info',
  transport: 'info',
  leisure: 'bad',
  other: 'neutral',
}

const INCOME_TYPE_OPTIONS: { value: Income['tp']; label: string }[] = [
  { value: '40_1', label: 'ม.40(1) เงินเดือน' },
  { value: '40_2', label: 'ม.40(2) รับจ้าง' },
  { value: '40_3', label: 'ม.40(3) ลิขสิทธิ์' },
  { value: '40_4', label: 'ม.40(4) ดอกเบี้ย/ปันผล' },
  { value: '40_5', label: 'ม.40(5) ให้เช่า' },
  { value: '40_6', label: 'ม.40(6) วิชาชีพอิสระ' },
  { value: '40_7', label: 'ม.40(7) รับเหมา' },
  { value: '40_8', label: 'ม.40(8) ธุรกิจ/อื่นๆ' },
]

const TOOL_CARDS: { id: ViewId; title: string; label: string; description: string; icon: string; badge: string }[] = [
  { id: 'tax', title: 'คำนวณภาษี + ค่าลดหย่อน', label: 'Thai PIT', description: 'รายได้ต่อปี ลดหย่อน เครดิตหัก ณ ที่จ่าย และภาษีขั้นบันได', icon: 'ti-receipt-tax', badge: 'ยอดนิยม' },
  { id: 'loan', title: 'ผ่อนบ้าน / รถ + โปะ', label: 'Debt planner', description: 'เทียบแผนผ่อนปกติ โปะเพิ่ม และ refinance', icon: 'ti-home-dollar', badge: 'ใช้บ่อย' },
  { id: 'retirement', title: 'วางแผนเกษียณ + DCA', label: 'Retirement', description: 'เป้าเงินหลังเกษียณ ช่องว่างพอร์ต และ DCA ที่ควรเติม', icon: 'ti-target-arrow', badge: 'วางแผนอนาคต' },
  { id: 'vault', title: 'คลังเอกสารภาษี', label: 'Document vault', description: 'เก็บรายการเอกสารสำคัญ เช่น 50 ทวิ ประกัน ใบเสร็จ', icon: 'ti-folder-check', badge: 'เตรียมยื่น' },
  { id: 'ai', title: 'AI Advisor', label: 'Advisor', description: 'ถามสรุปพอร์ต ภาษี กองทุนลดหย่อน และหนี้สินจากข้อมูลของคุณ', icon: 'ti-message-2', badge: 'วิเคราะห์เร็ว' },
]

export function DashboardView({ state, actions, onNavigate }: Props) {
  const [tab, setTab] = useState<TabId>('income')
  const [incomeTitle, setIncomeTitle] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeType, setIncomeType] = useState<Income['tp']>('40_1')
  const [incomeWht, setIncomeWht] = useState('')
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState<Expense['c']>('food')
  const [assetTitle, setAssetTitle] = useState('')
  const [assetValue, setAssetValue] = useState('')
  const [assetReturn, setAssetReturn] = useState('')
  const [assetType, setAssetType] = useState<Asset['tp']>('deposit')
  const [debtTitle, setDebtTitle] = useState('')
  const [debtBalance, setDebtBalance] = useState('')
  const [debtPayment, setDebtPayment] = useState('')
  const [debtRate, setDebtRate] = useState('')

  const totals = calcTotals(state)
  const tax = calcTax(state)
  const health = buildHealthMetrics(totals)
  const maxCashflow = Math.max(totals.inc, totals.exp, 1)
  const categoryExpenses = useMemo(() => (
    (Object.keys(EXPENSE_LABELS) as Expense['c'][]).map((category) => ({
      category,
      value: state.expenses.filter((expense) => expense.c === category).reduce((sum, item) => sum + item.a, 0),
    })).filter((item) => item.value > 0)
  ), [state.expenses])

  const addIncome = () => {
    const amount = Number(incomeAmount)
    if (!incomeTitle.trim() || amount <= 0) return
    actions.addIncome({ t: incomeTitle.trim(), a: amount, tp: incomeType, wht: Number(incomeWht) || 0 })
    setIncomeTitle('')
    setIncomeAmount('')
    setIncomeWht('')
  }

  const addExpense = () => {
    const amount = Number(expenseAmount)
    if (!expenseTitle.trim() || amount <= 0) return
    actions.addExpense({ t: expenseTitle.trim(), a: amount, c: expenseCategory })
    setExpenseTitle('')
    setExpenseAmount('')
  }

  const addAsset = () => {
    const value = Number(assetValue)
    if (!assetTitle.trim() || value <= 0) return
    actions.addAsset({ t: assetTitle.trim(), v: value, tp: assetType, r: Number(assetReturn) || 0 })
    setAssetTitle('')
    setAssetValue('')
    setAssetReturn('')
  }

  const addDebt = () => {
    const balance = Number(debtBalance)
    const payment = Number(debtPayment)
    if (!debtTitle.trim() || balance <= 0 || payment <= 0) return
    actions.addDebt({ t: debtTitle.trim(), b: balance, p: payment, r: Number(debtRate) || 0 })
    setDebtTitle('')
    setDebtBalance('')
    setDebtPayment('')
    setDebtRate('')
  }

  return (
    <>
      <PageHeader
        eyebrow="Calculator hub"
        title="เครื่องมือการเงินส่วนตัว"
        description="เริ่มจากเครื่องมือที่ต้องใช้บ่อยที่สุด แล้วค่อยบันทึกข้อมูลพื้นฐานเพื่อให้ทุกเครื่องมือคำนวณร่วมกันได้"
        meta="5 เครื่องมือ · ข้อมูลอยู่ในเครื่อง"
      />

      <section className="hero-panel">
        <div className="hero-panel__copy">
          <span className="eyebrow">Lucky Wealth</span>
          <h2>คำนวณภาษี หนี้ เกษียณ และภาพรวมพอร์ตจากข้อมูลชุดเดียว</h2>
          <p>ออกแบบใหม่ให้เป็น calculator hub แบบใช้งานจริง: เลือกเครื่องมือ กรอกสมมติฐาน ดูคำตอบหลัก และตรวจ breakdown ต่อได้ทันที</p>
        </div>
        <div className="hero-panel__stat">
          <span>ภาษีต้องชำระเพิ่ม</span>
          <strong>฿{fmt(tax.taxPayable)}</strong>
          <small>ก่อนเครดิต ฿{fmt(tax.taxBeforeCredits)} · WHT ฿{fmt(tax.withholdingCredit)}</small>
        </div>
      </section>

      <section className="tool-grid" aria-label="เครื่องมือทั้งหมด">
        {TOOL_CARDS.map((tool) => (
          <article key={tool.id} className="tool-card">
            <div className="tool-card__top">
              <div className="tool-card__icon"><i aria-hidden="true" className={`ti ${tool.icon}`} /></div>
              <Badge tone={tool.id === 'tax' ? 'warn' : tool.id === 'retirement' ? 'good' : 'info'}>{tool.badge}</Badge>
            </div>
            <p className="tool-card__label">{tool.label}</p>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <Button variant={tool.id === 'tax' ? 'primary' : 'secondary'} icon="ti-arrow-right" onClick={() => onNavigate(tool.id)}>เปิดเครื่องมือ</Button>
          </article>
        ))}
      </section>

      <section className="metric-grid">
        <MetricCard label="รายรับ/เดือน" value={`฿${fmt(totals.inc)}`} tone="good" note={`${state.incomes.length} แหล่งรายได้`} />
        <MetricCard label="รายจ่าย/เดือน" value={`฿${fmt(totals.exp)}`} tone="bad" note={`เหลือ ฿${fmt(totals.inc - totals.exp)}/เดือน`} />
        <MetricCard label="สินทรัพย์รวม" value={`฿${fmt(totals.ast)}`} tone="info" note={`${state.assets.length} รายการ`} />
        <MetricCard label="ภาษีต้องชำระเพิ่ม" value={`฿${fmt(tax.taxPayable)}`} tone="warn" note={`ก่อนเครดิต ฿${fmt(tax.taxBeforeCredits)} · rate ${tax.mg}%`} />
        {health.map((metric) => (
          <MetricCard key={metric.id} label={metric.label} value={metric.value} tone={metric.tone} note={<Badge tone={metric.tone}>{metric.note}</Badge>} />
        ))}
        <MetricCard label="สภาพคล่อง" value={`฿${fmt(totals.liq)}`} tone="info" note="เงินสด + เงินฝาก" />
      </section>

      <div className="content-grid content-grid--balanced">
        <Card title="กระแสเงินสดรายเดือน" eyebrow="Cashflow">
          <div className="bar-chart" aria-label="แผนภูมิกระแสเงินสด">
            <div className="bar-chart__bar bar-chart__bar--income" style={{ '--bar-height': `${Math.round((totals.inc / maxCashflow) * 100)}%` } as CSSProperties} title={`รายรับ ฿${fmt(totals.inc)}`} />
            {categoryExpenses.map((item) => (
              <div
                key={item.category}
                className={`bar-chart__bar bar-chart__bar--${item.category}`}
                style={{ '--bar-height': `${Math.round((item.value / maxCashflow) * 100)}%` } as CSSProperties}
                title={`${EXPENSE_LABELS[item.category]} ฿${fmt(item.value)}`}
              />
            ))}
          </div>
          <div className="legend">
            <span><i className="legend__dot legend__dot--income" />รายรับ ฿{fmt(totals.inc)}</span>
            {categoryExpenses.map((item) => (
              <span key={item.category}><i className={`legend__dot legend__dot--${item.category}`} />{EXPENSE_LABELS[item.category]} ฿{fmt(item.value)}</span>
            ))}
          </div>
        </Card>

        <Card title="เป้าหมายทางการเงิน" eyebrow="Goals">
          <div className="stack">
            <ProgressBar label="กองทุนฉุกเฉิน 6 เดือน" valueLabel={`฿${fmt(totals.liq)} / ฿${fmt(totals.exp * 6)}`} value={pct(totals.liq, totals.exp * 6)} tone="good" />
            <ProgressBar label="ภาษีปีนี้ (ประมาณ)" valueLabel={`฿${fmt(tax.taxPayable)}`} value={Math.min(100, (tax.taxPayable / 100000) * 100)} tone="warn" />
            <ProgressBar label="สินทรัพย์เทียบเป้า ฿1M" valueLabel={`฿${fmt(totals.ast)} / ฿1,000,000`} value={pct(totals.ast, 1000000)} tone="info" />
            <ProgressBar label="DTI เป้าไม่เกิน 40%" valueLabel={`${totals.dti.toFixed(1)}%`} value={Math.min(100, (totals.dti / 40) * 100)} tone={totals.dti <= 40 ? 'good' : 'bad'} />
          </div>
        </Card>
      </div>

      <Card title="บันทึกรายการ" eyebrow="Data entry">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'income', label: 'รายรับ' },
            { id: 'expense', label: 'รายจ่าย' },
            { id: 'asset', label: 'สินทรัพย์' },
            { id: 'debt', label: 'หนี้สิน' },
          ]}
        />

        {tab === 'income' && (
          <div className="entry-section">
            <div className="form-grid form-grid--5">
              <Input label="แหล่งรายได้" value={incomeTitle} onChange={(event) => setIncomeTitle(event.target.value)} placeholder="เช่น เงินเดือน, ฟรีแลนซ์" info="ตั้งชื่อรายการรายได้ เพื่อใช้แยกแหล่งที่มาในตารางและการคำนวณภาษี" />
              <Input label="บาท/เดือน" type="number" inputMode="decimal" value={incomeAmount} onChange={(event) => setIncomeAmount(event.target.value)} placeholder="45000" info="กรอกรายได้เฉลี่ยต่อเดือนก่อนหักภาษี ระบบจะรวมเป็นรายได้ทั้งปี" />
              <Input label="หัก ณ ที่จ่าย/เดือน" type="number" inputMode="decimal" value={incomeWht} onChange={(event) => setIncomeWht(event.target.value)} placeholder="0" info="กรอกภาษีที่ถูกหักไว้ต่อเดือนจากสลิปหรือใบ 50 ทวิ เพื่อคำนวณยอดต้องจ่ายเพิ่ม/ขอคืน" />
              <Select label="ประเภท ม.40" value={incomeType} onChange={(event) => setIncomeType(event.target.value as Income['tp'])} info="เลือกประเภทเงินได้ตามกฎหมายภาษีไทย มีผลต่อการหักค่าใช้จ่าย">
                {INCOME_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
              <Button icon="ti-plus" onClick={addIncome}>เพิ่ม</Button>
            </div>
            <DataTable headers={['รายการ', 'ประเภท', 'บาท/เดือน', 'หัก ณ ที่จ่าย/เดือน', '']}>
              {state.incomes.length === 0 ? <tr><td colSpan={5}><EmptyState title="ยังไม่มีรายรับ" /></td></tr> : state.incomes.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.t}</strong></td>
                  <td><Badge tone="good">{item.tp}</Badge></td>
                  <td className="num">฿{fmt(item.a)}</td>
                  <td className="num">฿{fmt(item.wht || 0)}</td>
                  <td className="action-cell"><Button variant="ghost" icon="ti-trash" onClick={() => actions.removeIncome(item.id)}>ลบ</Button></td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {tab === 'expense' && (
          <div className="entry-section">
            <div className="form-grid form-grid--4">
              <Input label="รายการ" value={expenseTitle} onChange={(event) => setExpenseTitle(event.target.value)} placeholder="เช่น ค่าอาหาร, ค่าเช่า" info="ตั้งชื่อรายจ่ายประจำเพื่อใช้ติดตาม cashflow" />
              <Input label="บาท/เดือน" type="number" inputMode="decimal" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="5000" info="กรอกยอดใช้จ่ายเฉลี่ยต่อเดือน" />
              <Select label="หมวด" value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value as Expense['c'])} info="เลือกหมวดเพื่อให้กราฟและสรุปรายจ่ายแยกประเภทได้ชัดเจน">
                {Object.entries(EXPENSE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Button icon="ti-plus" onClick={addExpense}>เพิ่ม</Button>
            </div>
            <DataTable headers={['รายการ', 'หมวด', 'บาท/เดือน', '']}>
              {state.expenses.length === 0 ? <tr><td colSpan={4}><EmptyState title="ยังไม่มีรายจ่าย" /></td></tr> : state.expenses.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.t}</strong></td>
                  <td><Badge tone={EXPENSE_TONES[item.c]}>{EXPENSE_LABELS[item.c]}</Badge></td>
                  <td className="num">฿{fmt(item.a)}</td>
                  <td className="action-cell"><Button variant="ghost" icon="ti-trash" onClick={() => actions.removeExpense(item.id)}>ลบ</Button></td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {tab === 'asset' && (
          <div className="entry-section">
            <div className="form-grid form-grid--5">
              <Input label="ชื่อสินทรัพย์" value={assetTitle} onChange={(event) => setAssetTitle(event.target.value)} placeholder="เช่น บัญชีออมทรัพย์" info="ตั้งชื่อสินทรัพย์ เช่น เงินฝาก หุ้น กองทุน หรืออสังหาฯ" />
              <Input label="มูลค่า" type="number" inputMode="decimal" value={assetValue} onChange={(event) => setAssetValue(event.target.value)} placeholder="100000" info="กรอกมูลค่าปัจจุบันโดยประมาณของสินทรัพย์" />
              <Input label="ผลตอบแทน %/ปี" type="number" inputMode="decimal" step="0.1" value={assetReturn} onChange={(event) => setAssetReturn(event.target.value)} placeholder="3.5" info="กรอกผลตอบแทนคาดการณ์ต่อปี ใช้ประกอบการจำลองแผนเกษียณ" />
              <Select label="ประเภท" value={assetType} onChange={(event) => setAssetType(event.target.value as Asset['tp'])} info="เลือกประเภทสินทรัพย์เพื่อแยกสภาพคล่องและพอร์ตลงทุน">
                <option value="deposit">เงินฝาก</option>
                <option value="stock">หุ้น</option>
                <option value="fund">กองทุน</option>
                <option value="cash">เงินสด</option>
                <option value="crypto">คริปโต</option>
                <option value="real_estate">อสังหาฯ</option>
              </Select>
              <Button icon="ti-plus" onClick={addAsset}>เพิ่ม</Button>
            </div>
            <DataTable headers={['สินทรัพย์', 'ประเภท', '%/ปี', 'มูลค่า', '']}>
              {state.assets.length === 0 ? <tr><td colSpan={5}><EmptyState title="ยังไม่มีสินทรัพย์" /></td></tr> : state.assets.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.t}</strong></td>
                  <td><Badge tone="info">{item.tp}</Badge></td>
                  <td className="num">{item.r}%</td>
                  <td className="num">฿{fmt(item.v)}</td>
                  <td className="action-cell"><Button variant="ghost" icon="ti-trash" onClick={() => actions.removeAsset(item.id)}>ลบ</Button></td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {tab === 'debt' && (
          <div className="entry-section">
            <div className="form-grid form-grid--5">
              <Input label="ชื่อหนี้สิน" value={debtTitle} onChange={(event) => setDebtTitle(event.target.value)} placeholder="เช่น ผ่อนบ้าน, ผ่อนรถ" info="ตั้งชื่อหนี้เพื่อแยกภาระผ่อนแต่ละก้อน" />
              <Input label="ยอดคงเหลือ" type="number" inputMode="decimal" value={debtBalance} onChange={(event) => setDebtBalance(event.target.value)} placeholder="2000000" info="กรอกยอดหนี้คงเหลือล่าสุด" />
              <Input label="ผ่อน/เดือน" type="number" inputMode="decimal" value={debtPayment} onChange={(event) => setDebtPayment(event.target.value)} placeholder="15000" info="กรอกยอดผ่อนขั้นต่ำหรือยอดที่จ่ายจริงต่อเดือน" />
              <Input label="ดอกเบี้ย %/ปี" type="number" inputMode="decimal" step="0.1" value={debtRate} onChange={(event) => setDebtRate(event.target.value)} placeholder="4.5" info="กรอกอัตราดอกเบี้ยต่อปีเพื่อใช้จำลองแผนปิดหนี้" />
              <Button icon="ti-plus" onClick={addDebt}>เพิ่ม</Button>
            </div>
            <DataTable headers={['หนี้สิน', 'ผ่อน/เดือน', 'ดอกเบี้ย', 'ยอดคงเหลือ', '']}>
              {state.debts.length === 0 ? <tr><td colSpan={5}><EmptyState title="ยังไม่มีหนี้สิน" /></td></tr> : state.debts.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.t}</strong></td>
                  <td className="num">฿{fmt(item.p)}</td>
                  <td className="num">{item.r}%</td>
                  <td className="num">฿{fmt(item.b)}</td>
                  <td className="action-cell"><Button variant="ghost" icon="ti-trash" onClick={() => actions.removeDebt(item.id)}>ลบ</Button></td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}
      </Card>
    </>
  )
}
