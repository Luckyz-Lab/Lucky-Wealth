import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { AppState, Asset, Expense, Income } from '../../types'
import type { WealthActions } from '../../hooks/usePersistentWealthState'
import { buildHealthMetrics, calcTotals } from '../../domain/finance'
import { fmt, pct } from '../../domain/format'
import { calcTax } from '../../domain/tax'
import { Badge, Button, Card, DataTable, EmptyState, Input, MetricCard, ProgressBar, Select, Tabs } from '../../components/ui'
import { PageHeader } from '../../components/layout'

interface Props {
  state: AppState
  actions: WealthActions
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

export function DashboardView({ state, actions }: Props) {
  const [tab, setTab] = useState<TabId>('income')
  const [incomeTitle, setIncomeTitle] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeType, setIncomeType] = useState<Income['tp']>('40_1')
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
    actions.addIncome({ t: incomeTitle.trim(), a: amount, tp: incomeType })
    setIncomeTitle('')
    setIncomeAmount('')
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
        eyebrow="Personal cockpit"
        title="ภาพรวมพอร์ต"
        description="เห็น cashflow, หนี้, สภาพคล่อง และภาษีประมาณการในจอเดียว"
        meta="ปีภาษี 2569 · estimator"
      />

      <section className="hero-panel">
        <div className="hero-panel__copy">
          <span className="eyebrow">Lucky Wealth</span>
          <h2>ระบบส่วนตัวสำหรับตัดสินใจเรื่องเงินแบบเร็วและตรวจสอบย้อนกลับได้</h2>
          <p>ข้อมูลยังเก็บในเครื่องผ่าน localStorage เหมาะกับการใช้งานส่วนตัวก่อนเชื่อม Cloud Sync ในเฟสถัดไป</p>
        </div>
        <div className="hero-panel__stat">
          <span>Net Worth</span>
          <strong>฿{fmt(totals.nw)}</strong>
          <small>สินทรัพย์ ฿{fmt(totals.ast)} · หนี้ ฿{fmt(totals.dbt)}</small>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label="รายรับ/เดือน" value={`฿${fmt(totals.inc)}`} tone="good" note={`${state.incomes.length} แหล่งรายได้`} />
        <MetricCard label="รายจ่าย/เดือน" value={`฿${fmt(totals.exp)}`} tone="bad" note={`เหลือ ฿${fmt(totals.inc - totals.exp)}/เดือน`} />
        <MetricCard label="สินทรัพย์รวม" value={`฿${fmt(totals.ast)}`} tone="info" note={`${state.assets.length} รายการ`} />
        <MetricCard label="ภาษีประมาณการ" value={`฿${fmt(tax.tax)}`} tone="warn" note={`Marginal rate ${tax.mg}%`} />
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
            <ProgressBar label="ภาษีปีนี้ (ประมาณ)" valueLabel={`฿${fmt(tax.tax)}`} value={Math.min(100, (tax.tax / 100000) * 100)} tone="warn" />
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
            <div className="form-grid form-grid--4">
              <Input label="แหล่งรายได้" value={incomeTitle} onChange={(event) => setIncomeTitle(event.target.value)} placeholder="เช่น เงินเดือน, ฟรีแลนซ์" />
              <Input label="บาท/เดือน" type="number" value={incomeAmount} onChange={(event) => setIncomeAmount(event.target.value)} placeholder="45000" />
              <Select label="ประเภท ม.40" value={incomeType} onChange={(event) => setIncomeType(event.target.value as Income['tp'])}>
                <option value="40_1">ม.40(1) เงินเดือน</option>
                <option value="40_2">ม.40(2) รับจ้าง</option>
                <option value="40_8">ม.40(8) อื่นๆ</option>
              </Select>
              <Button icon="ti-plus" onClick={addIncome}>เพิ่ม</Button>
            </div>
            <DataTable headers={['รายการ', 'ประเภท', 'บาท/เดือน', '']}>
              {state.incomes.length === 0 ? <tr><td colSpan={4}><EmptyState title="ยังไม่มีรายรับ" /></td></tr> : state.incomes.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.t}</strong></td>
                  <td><Badge tone="good">{item.tp}</Badge></td>
                  <td className="num">฿{fmt(item.a)}</td>
                  <td className="action-cell"><Button variant="ghost" icon="ti-trash" onClick={() => actions.removeIncome(item.id)}>ลบ</Button></td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {tab === 'expense' && (
          <div className="entry-section">
            <div className="form-grid form-grid--4">
              <Input label="รายการ" value={expenseTitle} onChange={(event) => setExpenseTitle(event.target.value)} placeholder="เช่น ค่าอาหาร, ค่าเช่า" />
              <Input label="บาท/เดือน" type="number" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="5000" />
              <Select label="หมวด" value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value as Expense['c'])}>
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
              <Input label="ชื่อสินทรัพย์" value={assetTitle} onChange={(event) => setAssetTitle(event.target.value)} placeholder="เช่น บัญชีออมทรัพย์" />
              <Input label="มูลค่า" type="number" value={assetValue} onChange={(event) => setAssetValue(event.target.value)} placeholder="100000" />
              <Input label="ผลตอบแทน %/ปี" type="number" step="0.1" value={assetReturn} onChange={(event) => setAssetReturn(event.target.value)} placeholder="3.5" />
              <Select label="ประเภท" value={assetType} onChange={(event) => setAssetType(event.target.value as Asset['tp'])}>
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
              <Input label="ชื่อหนี้สิน" value={debtTitle} onChange={(event) => setDebtTitle(event.target.value)} placeholder="เช่น ผ่อนบ้าน, ผ่อนรถ" />
              <Input label="ยอดคงเหลือ" type="number" value={debtBalance} onChange={(event) => setDebtBalance(event.target.value)} placeholder="2000000" />
              <Input label="ผ่อน/เดือน" type="number" value={debtPayment} onChange={(event) => setDebtPayment(event.target.value)} placeholder="15000" />
              <Input label="ดอกเบี้ย %/ปี" type="number" step="0.1" value={debtRate} onChange={(event) => setDebtRate(event.target.value)} placeholder="4.5" />
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
