import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { AppState, Deductions, Income } from '../../types'
import type { WealthActions } from '../../hooks/usePersistentWealthState'
import { fmt, pct } from '../../domain/format'
import { calcTax } from '../../domain/tax'
import { Badge, Button, Card, DataTable, Input, MetricCard, ProgressBar, Select } from '../../components/ui'
import { PageHeader } from '../../components/layout'

interface Props {
  state: AppState
  actions: WealthActions
}

const INCOME_TYPE_OPTIONS: { value: Income['tp']; label: string }[] = [
  { value: '40_1', label: 'ม.40(1) เงินเดือน' },
  { value: '40_2', label: 'ม.40(2) รับจ้าง/ฟรีแลนซ์' },
  { value: '40_3', label: 'ม.40(3) ลิขสิทธิ์' },
  { value: '40_4', label: 'ม.40(4) ดอกเบี้ย/เงินปันผล' },
  { value: '40_5', label: 'ม.40(5) ให้เช่าทรัพย์สิน' },
  { value: '40_6', label: 'ม.40(6) วิชาชีพอิสระ' },
  { value: '40_7', label: 'ม.40(7) รับเหมา' },
  { value: '40_8', label: 'ม.40(8) ธุรกิจ/อื่นๆ' },
]

const DED_ITEMS: { key: keyof Deductions; label: string; max: number; step?: number; locked?: boolean; info: string }[] = [
  { key: 'personal', label: 'ค่าลดหย่อนส่วนตัว', max: 60000, locked: true, info: 'สิทธิพื้นฐานของผู้มีเงินได้ ระบบล็อกไว้ที่ 60,000 บาท' },
  { key: 'spouse', label: 'คู่สมรส', max: 60000, info: 'กรอกได้เมื่อคู่สมรสไม่มีเงินได้ตามเงื่อนไขภาษี' },
  { key: 'children', label: 'บุตร (จำนวนคน)', max: 5, step: 1, info: 'กรอกเป็นจำนวนคน ระบบคูณ 30,000 บาทต่อคน' },
  { key: 'parents', label: 'บิดามารดา (จำนวนคน)', max: 4, step: 1, info: 'กรอกจำนวนบิดามารดาที่เข้าเงื่อนไข ระบบคูณ 30,000 บาทต่อคน' },
  { key: 'disabled', label: 'ผู้พิการ/ทุพพลภาพ (จำนวนคน)', max: 5, step: 1, info: 'กรอกจำนวนคนที่อุปการะและมีเอกสารตามเงื่อนไข' },
  { key: 'maternity', label: 'ฝากครรภ์และคลอดบุตร', max: 60000, info: 'กรอกยอดใบเสร็จจริง ไม่เกินเพดานที่ระบบกำหนด' },
  { key: 'lifeIns', label: 'ประกันชีวิต', max: 100000, info: 'กรอกเบี้ยประกันชีวิตที่มีหนังสือรับรองลดหย่อน' },
  { key: 'healthIns', label: 'ประกันสุขภาพ', max: 25000, info: 'กรอกเบี้ยประกันสุขภาพตนเอง ระบบรวมกับประกันชีวิตภายใต้เพดานหลัก' },
  { key: 'parentHealthIns', label: 'ประกันสุขภาพบิดามารดา', max: 15000, info: 'กรอกเบี้ยประกันสุขภาพพ่อแม่ที่เข้าเงื่อนไข' },
  { key: 'pensionLifeIns', label: 'ประกันชีวิตแบบบำนาญ', max: 200000, info: 'กรอกเบี้ยประกันบำนาญ ระบบจำกัดตามเพดานประมาณการ' },
  { key: 'pvd', label: 'กองทุนสำรอง PVD', max: 500000, info: 'กรอกเงินสะสมกองทุนสำรองเลี้ยงชีพทั้งปี' },
  { key: 'gpf', label: 'กบข.', max: 500000, info: 'กรอกเงินสะสม กบข. ถ้ามี' },
  { key: 'teacherFund', label: 'กองทุนสงเคราะห์ครู', max: 500000, info: 'กรอกเงินสะสมกองทุนสงเคราะห์ครูโรงเรียนเอกชนถ้ามี' },
  { key: 'nssf', label: 'กอช.', max: 30000, info: 'กรอกเงินสะสมกองทุนการออมแห่งชาติถ้ามี' },
  { key: 'sso', label: 'ประกันสังคม', max: 9000, info: 'กรอกเงินสมทบประกันสังคมทั้งปี โดยทั่วไปสูงสุด 9,000 บาท' },
  { key: 'rmf', label: 'RMF', max: 500000, info: 'กรอกยอดซื้อ RMF ทั้งปี ต้องตรวจเงื่อนไขการถือครองก่อนยื่นจริง' },
  { key: 'ssf', label: 'SSF', max: 200000, info: 'กรอกยอดซื้อ SSF ทั้งปี ต้องตรวจเงื่อนไขกองทุนและเพดานรวม' },
  { key: 'thaiEsg', label: 'Thai ESG Fund', max: 300000, info: 'กรอกยอดซื้อ Thai ESG ที่มีเอกสารรับรอง' },
  { key: 'thaiEsgX', label: 'Thai ESGX', max: 300000, info: 'กรอกยอด Thai ESGX ถ้ามี ต้องตรวจประกาศปีภาษีนั้นอีกครั้ง' },
  { key: 'homeLoan', label: 'ดอกเบี้ยกู้บ้าน', max: 100000, info: 'กรอกเฉพาะดอกเบี้ยกู้ซื้อที่อยู่อาศัยทั้งปี ไม่ใช่ยอดผ่อนทั้งหมด' },
  { key: 'educationDonation', label: 'บริจาคการศึกษา/กีฬา', max: 100000, info: 'กรอกยอดบริจาคที่มีเอกสาร ระบบคำนวณแบบสองเท่าภายใต้เพดาน' },
  { key: 'generalDonation', label: 'บริจาคทั่วไป', max: 100000, info: 'กรอกยอดบริจาคทั่วไปที่มีหลักฐาน' },
  { key: 'socialEnterprise', label: 'ลงทุนวิสาหกิจเพื่อสังคม', max: 100000, info: 'กรอกยอดลงทุนที่เข้าเงื่อนไขลดหย่อน' },
  { key: 'easyReceipt', label: 'Easy E-Receipt', max: 50000, info: 'กรอกยอดใช้จ่ายตามมาตรการและช่วงเวลาที่ประกาศสำหรับปีภาษีนั้น' },
]

export function TaxView({ state, actions }: Props) {
  const [incomeTitle, setIncomeTitle] = useState('เงินเดือน')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeWht, setIncomeWht] = useState('')
  const [incomeType, setIncomeType] = useState<Income['tp']>('40_1')
  const tax = calcTax(state)
  const marginalTone = tax.mg <= 10 ? 'good' : tax.mg <= 25 ? 'warn' : 'bad'

  const addIncome = () => {
    const amount = Number(incomeAmount)
    if (!incomeTitle.trim() || amount <= 0) return
    actions.addIncome({ t: incomeTitle.trim(), a: amount, wht: Number(incomeWht) || 0, tp: incomeType })
    setIncomeTitle('')
    setIncomeAmount('')
    setIncomeWht('')
  }

  return (
    <>
      <PageHeader
        eyebrow="Tax estimator"
        title="วางแผนภาษีสรรพากร"
        description="คำนวณภาษีเงินได้บุคคลธรรมดาแบบประมาณการ พร้อม breakdown, เครดิตหัก ณ ที่จ่าย และข้อจำกัดของสูตร"
        meta={`ปีภาษี ${tax.taxYear} · ${tax.ruleVersion}`}
      />

      <div className="notice notice--warn">
        <i aria-hidden="true" className="ti ti-alert-triangle" />
        <div>
          <strong>ตัวเลขภาษีเป็นประมาณการ</strong>
          <p>{tax.formHint} · ก่อนยื่นจริงต้องตรวจประเภทเงินได้ เอกสารลดหย่อน และประกาศปีภาษีกับกรมสรรพากร</p>
        </div>
      </div>

      <Card title="รายได้ที่ใช้คำนวณภาษี" eyebrow="Income input">
        <div className="form-grid form-grid--5">
          <Input label="ชื่อรายได้" value={incomeTitle} onChange={(event) => setIncomeTitle(event.target.value)} info="ตั้งชื่อให้จำง่าย เช่น เงินเดือนบริษัท, ฟรีแลนซ์, เงินปันผล" placeholder="เงินเดือน" />
          <Input label="จำนวนเงิน/เดือน" type="number" inputMode="decimal" value={incomeAmount} onChange={(event) => setIncomeAmount(event.target.value)} info="กรอกเงินเดือนหรือรายได้เฉลี่ยต่อเดือนก่อนหักภาษี ระบบจะคูณ 12 เป็นรายปี" placeholder="85000" />
          <Input label="ภาษีหัก ณ ที่จ่าย/เดือน" type="number" inputMode="decimal" value={incomeWht} onChange={(event) => setIncomeWht(event.target.value)} info="กรอกยอดภาษีที่ถูกหักไว้ในแต่ละเดือนจากสลิปเงินเดือนหรือใบ 50 ทวิ" placeholder="4500" />
          <Select label="ประเภทเงินได้" value={incomeType} onChange={(event) => setIncomeType(event.target.value as Income['tp'])} info="เลือกประเภทเงินได้ตามมาตรา 40 เพื่อให้ระบบเลือกวิธีคำนวณค่าใช้จ่ายที่เหมาะสม">
            {INCOME_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
          <Button icon="ti-plus" onClick={addIncome}>เพิ่มรายได้</Button>
        </div>

        <DataTable headers={['รายการ', 'ประเภท', 'บาท/เดือน', 'หัก ณ ที่จ่าย/เดือน', '']}>
          {state.incomes.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.t}</strong></td>
              <td><Badge tone="info">{item.tp}</Badge></td>
              <td className="num">฿{fmt(item.a)}</td>
              <td className="num">฿{fmt(item.wht || 0)}</td>
              <td className="action-cell"><Button variant="ghost" icon="ti-trash" onClick={() => actions.removeIncome(item.id)}>ลบ</Button></td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <div className="content-grid content-grid--balanced">
        <Card title="รายการลดหย่อน" eyebrow="Inputs">
          <div className="deduction-grid">
            {DED_ITEMS.map((item) => (
              <Input
                key={item.key}
                label={item.label}
                type="number"
                min={0}
                max={item.max}
                step={item.step || 1}
                value={state.ded[item.key]}
                readOnly={item.locked}
                info={item.info}
                helper={item.locked ? 'ค่าคงที่พื้นฐาน' : `เพดาน ${fmt(item.max)}`}
                onChange={(event) => actions.updateDeductions(item.key, Number(event.target.value) || 0)}
              />
            ))}
          </div>
        </Card>

        <Card title="ผลการคำนวณ" eyebrow="Estimate">
          <div className="metric-grid metric-grid--compact">
            <MetricCard label="รายได้สุทธิ" value={`฿${fmt(tax.net)}`} note="หลังหักค่าใช้จ่ายและลดหย่อน" />
            <MetricCard label="ภาษีก่อนเครดิต" value={`฿${fmt(tax.taxBeforeCredits)}`} tone="warn" note="ตามขั้นบันไดภาษี" />
            <MetricCard label="หัก ณ ที่จ่าย" value={`฿${fmt(tax.withholdingCredit)}`} tone="info" note="รวมจากรายได้ที่บันทึก" />
            <MetricCard label={tax.refund > 0 ? 'คาดว่าขอคืนได้' : 'ต้องชำระเพิ่ม'} value={`฿${fmt(tax.refund > 0 ? tax.refund : tax.taxPayable)}`} tone={tax.refund > 0 ? 'good' : 'bad'} note="หลังเครดิตภาษีหัก ณ ที่จ่าย" />
            <MetricCard label="Marginal Rate" value={`${tax.mg}%`} tone={marginalTone} note={<Badge tone={marginalTone}>อัตราสูงสุด</Badge>} />
            <MetricCard label="ลดหย่อนรวม" value={`฿${fmt(tax.tot)}`} tone="good" note="รวมรายการที่บันทึก" />
          </div>
          <div className="stack">
            <ProgressBar label="หักค่าใช้จ่าย 50%" valueLabel={`฿${fmt(tax.exd)}`} value={pct(tax.exd, tax.ann)} tone="info" />
            <ProgressBar label="ลดหย่อนรวม" valueLabel={`฿${fmt(tax.tot)}`} value={pct(tax.tot, tax.ann)} tone="good" />
          </div>
        </Card>
      </div>

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

        <Card title="รายการลดหย่อนที่ใช้จริง" eyebrow="Applied deductions">
          <DataTable headers={['รายการ', 'จำนวนเงิน']}>
            {tax.deductionBreakdown.length === 0 ? (
              <tr><td colSpan={2}>ยังไม่มีรายการลดหย่อน</td></tr>
            ) : tax.deductionBreakdown.map((line) => (
              <tr key={line.label}><td>{line.label}</td><td className="num">฿{fmt(line.amount)}</td></tr>
            ))}
          </DataTable>
        </Card>
      </div>

      <div className="content-grid content-grid--balanced">
        <Card title="ขั้นบันไดภาษี" eyebrow="Brackets">
          <div className="bracket-list">
            {tax.bd.filter((bracket) => bracket.txbl > 0).map((bracket) => (
              <div key={bracket.rate} className="bracket">
                <span>{bracket.rate}%</span>
                <div className="bracket__track"><div className="bracket__fill" style={{ '--progress': `${(bracket.rate / 35) * 100}%` } as CSSProperties} /></div>
                <strong>฿{fmt(bracket.tax)}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card title="โอกาสประหยัดภาษี" eyebrow="Optimizer">
          {tax.rmfR <= 0 && tax.ssfR <= 0 && tax.esgR <= 0 ? (
            <div className="empty-state empty-state--inline">
              <strong>ใช้สิทธิ์กองทุนครบตามข้อมูลที่กรอกแล้ว</strong>
              <p>ยังต้องตรวจเงื่อนไขการถือครองและประกาศปีภาษีจริง</p>
            </div>
          ) : (
            <div className="insight-grid">
              {tax.rmfR > 0 && <div className="insight"><h3>RMF เพิ่มได้ ฿{fmt(tax.rmfR)}</h3><p>ประหยัดโดยประมาณ ฿{fmt(tax.rmfR * tax.mg / 100)}</p></div>}
              {tax.ssfR > 0 && <div className="insight"><h3>SSF เพิ่มได้ ฿{fmt(tax.ssfR)}</h3><p>ประหยัดโดยประมาณ ฿{fmt(tax.ssfR * tax.mg / 100)}</p></div>}
              {tax.esgR > 0 && <div className="insight"><h3>Thai ESG เพิ่มได้ ฿{fmt(tax.esgR)}</h3><p>โควตาแยก ประหยัดโดยประมาณ ฿{fmt(tax.esgR * tax.mg / 100)}</p></div>}
            </div>
          )}
        </Card>
      </div>

      <div className="content-grid content-grid--balanced">
        <Card title="ข้อจำกัดของตัวคำนวณ" eyebrow="Risk control">
          <div className="stack">
            {tax.warnings.map((warning) => (
              <div key={warning} className="notice notice--warn">
                <i aria-hidden="true" className="ti ti-alert-circle" />
                <p>{warning}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="แหล่งอ้างอิง" eyebrow="Official sources">
          <div className="source-list">
            {tax.sourceUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">{url}</a>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
