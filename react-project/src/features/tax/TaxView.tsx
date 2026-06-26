import type { CSSProperties } from 'react'
import type { AppState, Deductions } from '../../types'
import type { WealthActions } from '../../hooks/usePersistentWealthState'
import { fmt, pct } from '../../domain/format'
import { calcTax } from '../../domain/tax'
import { Badge, Card, Input, MetricCard, ProgressBar } from '../../components/ui'
import { PageHeader } from '../../components/layout'

interface Props {
  state: AppState
  actions: WealthActions
}

const DED_ITEMS: { key: keyof Deductions; label: string; max: number; step?: number; locked?: boolean }[] = [
  { key: 'personal', label: 'ค่าลดหย่อนส่วนตัว', max: 60000, locked: true },
  { key: 'spouse', label: 'คู่สมรส', max: 60000 },
  { key: 'children', label: 'บุตร (จำนวนคน)', max: 5, step: 1 },
  { key: 'lifeIns', label: 'ประกันชีวิต', max: 100000 },
  { key: 'healthIns', label: 'ประกันสุขภาพ', max: 25000 },
  { key: 'pvd', label: 'กองทุนสำรอง PVD', max: 500000 },
  { key: 'sso', label: 'ประกันสังคม', max: 9000 },
  { key: 'rmf', label: 'RMF', max: 500000 },
  { key: 'ssf', label: 'SSF', max: 200000 },
  { key: 'thaiEsg', label: 'Thai ESG Fund', max: 300000 },
  { key: 'homeLoan', label: 'ดอกเบี้ยกู้บ้าน', max: 100000 },
  { key: 'charity', label: 'บริจาคการศึกษา', max: 100000 },
  { key: 'easyReceipt', label: 'Easy E-Receipt', max: 50000 },
]

export function TaxView({ state, actions }: Props) {
  const tax = calcTax(state)
  const marginalTone = tax.mg <= 10 ? 'good' : tax.mg <= 25 ? 'warn' : 'bad'

  return (
    <>
      <PageHeader
        eyebrow="Tax estimator"
        title="วางแผนภาษีสรรพากร"
        description="คำนวณภาษีเงินได้บุคคลธรรมดาแบบประมาณการ พร้อมเห็นช่องลดหย่อนที่ยังเหลือ"
        meta="ยังไม่ใช่เอกสารยื่นภาษี"
      />

      <div className="notice notice--warn">
        <i aria-hidden="true" className="ti ti-alert-triangle" />
        <div>
          <strong>ตัวเลขภาษีเป็นประมาณการ</strong>
          <p>ก่อนนำไปยื่นจริงต้องตรวจสูตร เพดานลดหย่อน และประกาศปีภาษีกับแหล่งทางการ พร้อมทำ golden test case เพิ่มเติม</p>
        </div>
      </div>

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
                helper={item.locked ? 'ค่าคงที่พื้นฐาน' : `เพดาน ${fmt(item.max)}`}
                onChange={(event) => actions.updateDeductions(item.key, Number(event.target.value) || 0)}
              />
            ))}
          </div>
        </Card>

        <Card title="ผลการคำนวณ" eyebrow="Estimate">
          <div className="metric-grid metric-grid--compact">
            <MetricCard label="รายได้สุทธิ" value={`฿${fmt(tax.net)}`} note="หลังหักค่าใช้จ่ายและลดหย่อน" />
            <MetricCard label="ภาษีที่ต้องชำระ" value={`฿${fmt(tax.tax)}`} tone="warn" note="ยังไม่รวมภาษีหัก ณ ที่จ่าย" />
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
    </>
  )
}
