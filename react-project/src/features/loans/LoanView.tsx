import { useEffect, useState } from 'react'
import type { AppState, ViewId } from '../../types'
import { fmt } from '../../domain/format'
import { loanCalc } from '../../domain/loans'
import { Card, DataTable, EmptyState, Input, Methodology, MetricCard, RelatedTools, Select } from '../../components/ui'
import { PageHeader } from '../../components/layout'

interface Props {
  state: AppState
  onNavigate: (view: ViewId) => void
}

function parseMoney(value: string): number {
  return Number(value.replace(/,/g, '')) || 0
}

function formatMoneyText(value: string): string {
  const raw = value.replace(/[^\d]/g, '')
  return raw ? fmt(Number(raw) || 0) : ''
}

export function LoanView({ state, onNavigate }: Props) {
  const [selectedId, setSelectedId] = useState(state.debts[0]?.id || '')
  const [extraInput, setExtraInput] = useState('3,000')
  const [refi, setRefi] = useState(3.3)

  useEffect(() => {
    if (!state.debts.some((debt) => debt.id === selectedId)) setSelectedId(state.debts[0]?.id || '')
  }, [selectedId, state.debts])

  const debt = state.debts.find((item) => item.id === selectedId)
  const extra = parseMoney(extraInput)

  if (!state.debts.length) {
    return (
      <>
        <PageHeader eyebrow="Debt planner" title="ผ่อนบ้าน / รถ + โปะ" description="วิเคราะห์การโปะเงินต้น refinance และดอกเบี้ยรวมแบบ result-first" />
        <EmptyState title="ยังไม่มีหนี้สิน" description="เพิ่มหนี้สินจากหน้า Dashboard ก่อนเริ่มจำลอง" />
      </>
    )
  }

  const normal = debt ? loanCalc(debt.b, debt.r, debt.p, 0) : null
  const faster = debt ? loanCalc(debt.b, debt.r, debt.p, extra) : null
  const refiOnly = debt ? loanCalc(debt.b, refi, debt.p, 0) : null
  const refiFast = debt ? loanCalc(debt.b, refi, debt.p, extra) : null
  const scenarios = debt ? [0, 2000, 5000, 10000, extra].filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => a - b) : []

  return (
    <>
      <PageHeader eyebrow="Debt planner" title="ผ่อนบ้าน / รถ + โปะ" description="เลือกหนี้สิน ตั้งเงินโปะเพิ่มหรือดอกเบี้ย refinance แล้วดูผลต่างของเวลาและดอกเบี้ยทันที" />

      {debt && normal && faster && refiOnly && refiFast && (
        <section className="calculator-result">
          <div className="summary-hero">
            <span>ประหยัดสูงสุดจาก Refinance + โปะ</span>
            <strong>฿{fmt(normal.totalInt - refiFast.totalInt)}</strong>
            <small>ลดเวลาจาก {normal.months} เดือน เหลือ {refiFast.months} เดือน</small>
          </div>
          <div className="metric-grid metric-grid--scenario">
            <MetricCard label="แผนปกติ" value={`${Math.floor(normal.months / 12)} ปี ${normal.months % 12} เดือน`} note={`ดอกเบี้ยรวม ฿${fmt(normal.totalInt)}`} />
            <MetricCard label={`โปะเพิ่ม ฿${fmt(extra)}`} value={`${Math.floor(faster.months / 12)} ปี ${faster.months % 12} เดือน`} tone="good" note={`ประหยัด ฿${fmt(normal.totalInt - faster.totalInt)}`} />
            <MetricCard label={`Refinance ${refi}%`} value={`${Math.floor(refiOnly.months / 12)} ปี ${refiOnly.months % 12} เดือน`} tone={refi < debt.r ? 'good' : 'warn'} note={`ประหยัด ฿${fmt(normal.totalInt - refiOnly.totalInt)}`} />
            <MetricCard label="Refinance + โปะ" value={`${Math.floor(refiFast.months / 12)} ปี ${refiFast.months % 12} เดือน`} tone="good" note={`ประหยัด ฿${fmt(normal.totalInt - refiFast.totalInt)}`} />
          </div>
        </section>
      )}

      <Card title="1. สมมติฐานเงินกู้" eyebrow="Inputs">
        <div className="preset-row">
          {[0, 2000, 5000, 10000].map((amount) => (
            <button key={amount} type="button" className="chip" onClick={() => setExtraInput(fmt(amount))}>โปะ ฿{fmt(amount)}</button>
          ))}
          {[2.9, 3.3, 3.9, 4.5].map((rate) => (
            <button key={rate} type="button" className="chip" onClick={() => setRefi(rate)}>Refi {rate}%</button>
          ))}
        </div>
        <div className="form-grid form-grid--3">
          <Select label="เลือกหนี้สิน" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} info="เลือกหนี้จากข้อมูลที่บันทึกไว้ในหน้าแรก เช่น บ้าน รถ หรือสินเชื่อส่วนบุคคล">
            {state.debts.map((item) => <option key={item.id} value={item.id}>{item.t} (฿{fmt(item.b)})</option>)}
          </Select>
          <Input label="โปะเพิ่ม/เดือน" inputMode="decimal" value={extraInput} onChange={(event) => setExtraInput(formatMoneyText(event.target.value))} info="ยอดเงินที่จ่ายเพิ่มจากค่างวดปกติทุกเดือน เพื่อลดเงินต้นและดอกเบี้ย" />
          <Input label="อัตรา Refinance (%/ปี)" type="number" step="0.1" value={refi} onChange={(event) => setRefi(Number(event.target.value) || 0)} info="อัตราดอกเบี้ยใหม่ที่คาดว่าจะได้หลัง refinance หรือ retention" />
        </div>
      </Card>

      {debt && normal && (
        <Card title="2. ตารางเปรียบเทียบสถานการณ์โปะ" eyebrow="Scenarios">
          <DataTable headers={['โปะเพิ่ม/เดือน', 'ระยะเวลา', 'ดอกเบี้ยรวม', 'ประหยัดได้']}>
            {scenarios.map((amount) => {
              const result = loanCalc(debt.b, debt.r, debt.p, amount)
              const saving = normal.totalInt - result.totalInt
              return (
                <tr key={amount}>
                  <td>฿{fmt(amount)}</td>
                  <td>{Math.floor(result.months / 12)} ปี {result.months % 12} เดือน</td>
                  <td className="num">฿{fmt(result.totalInt)}</td>
                  <td className="num">{saving > 0 ? `฿${fmt(saving)}` : '-'}</td>
                </tr>
              )
            })}
          </DataTable>
        </Card>
      )}

      <Methodology
        items={[
          'ใช้ยอดหนี้คงเหลือ ดอกเบี้ยต่อปี และยอดผ่อนต่อเดือนจากข้อมูลหนี้ที่บันทึกไว้',
          'จำลองดอกเบี้ยรายเดือนและตัดเงินต้นจนยอดหนี้เป็นศูนย์ เพื่อหาเดือนที่ปิดหนี้และดอกเบี้ยรวม',
          'เปรียบเทียบแผนปกติ แผนโปะเพิ่ม แผน refinance และแผน refinance พร้อมโปะ เพื่อดูเงินที่ประหยัดได้',
        ]}
        note="ผลลัพธ์เป็นประมาณการ ไม่รวมค่าธรรมเนียม refinance ประกัน MRTA ค่าจดจำนอง หรือเงื่อนไขเฉพาะสัญญา"
      />

      <RelatedTools
        onNavigate={onNavigate}
        items={[
          { id: 'tax', title: 'คำนวณภาษี + ค่าลดหย่อน', description: 'ดูภาษีที่ต้องกันไว้ก่อนตัดสินใจโปะหนี้ก้อนใหญ่', icon: 'ti-receipt-tax' },
          { id: 'retirement', title: 'วางแผนเกษียณ + DCA', description: 'เทียบว่าเงินโปะควรแบ่งไปลงทุนระยะยาวหรือไม่', icon: 'ti-target-arrow' },
          { id: 'dashboard', title: 'ภาพรวมข้อมูลส่วนตัว', description: 'กลับไปเพิ่มหนี้ สินทรัพย์ รายรับ และรายจ่าย', icon: 'ti-layout-dashboard' },
        ]}
      />
    </>
  )
}
