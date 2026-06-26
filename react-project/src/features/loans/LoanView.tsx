import { useEffect, useState } from 'react'
import type { AppState } from '../../types'
import { fmt } from '../../domain/format'
import { loanCalc } from '../../domain/loans'
import { Card, DataTable, EmptyState, Input, MetricCard, Select } from '../../components/ui'
import { PageHeader } from '../../components/layout'

interface Props {
  state: AppState
}

export function LoanView({ state }: Props) {
  const [selectedId, setSelectedId] = useState(state.debts[0]?.id || '')
  const [extra, setExtra] = useState(3000)
  const [refi, setRefi] = useState(3.3)

  useEffect(() => {
    if (!state.debts.some((debt) => debt.id === selectedId)) setSelectedId(state.debts[0]?.id || '')
  }, [selectedId, state.debts])

  const debt = state.debts.find((item) => item.id === selectedId)

  if (!state.debts.length) {
    return (
      <>
        <PageHeader eyebrow="Debt planner" title="ผ่อนบ้าน / รถ" description="วิเคราะห์การโปะเงินต้นและ refinance" />
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
      <PageHeader eyebrow="Debt planner" title="ผ่อนบ้าน / รถ" description="เทียบแผนปกติ โปะเพิ่ม และ refinance เพื่อเห็นเวลาที่ลดลง" />
      <Card title="สมมติฐาน" eyebrow="Inputs">
        <div className="form-grid form-grid--3">
          <Select label="เลือกหนี้สิน" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {state.debts.map((item) => <option key={item.id} value={item.id}>{item.t} (฿{fmt(item.b)})</option>)}
          </Select>
          <Input label="โปะเพิ่ม/เดือน" type="number" value={extra} onChange={(event) => setExtra(Number(event.target.value) || 0)} />
          <Input label="อัตรา Refinance (%/ปี)" type="number" step="0.1" value={refi} onChange={(event) => setRefi(Number(event.target.value) || 0)} />
        </div>
      </Card>

      {debt && normal && faster && refiOnly && refiFast && (
        <section className="metric-grid metric-grid--scenario">
          <MetricCard label="แผนปกติ" value={`${Math.floor(normal.months / 12)} ปี ${normal.months % 12} เดือน`} note={`ดอกเบี้ยรวม ฿${fmt(normal.totalInt)}`} />
          <MetricCard label={`โปะเพิ่ม ฿${fmt(extra)}`} value={`${Math.floor(faster.months / 12)} ปี ${faster.months % 12} เดือน`} tone="good" note={`ประหยัด ฿${fmt(normal.totalInt - faster.totalInt)}`} />
          <MetricCard label={`Refinance ${refi}%`} value={`${Math.floor(refiOnly.months / 12)} ปี ${refiOnly.months % 12} เดือน`} tone={refi < debt.r ? 'good' : 'warn'} note={`ประหยัด ฿${fmt(normal.totalInt - refiOnly.totalInt)}`} />
          <MetricCard label="Refinance + โปะ" value={`${Math.floor(refiFast.months / 12)} ปี ${refiFast.months % 12} เดือน`} tone="good" note={`ประหยัดสูงสุด ฿${fmt(normal.totalInt - refiFast.totalInt)}`} />
        </section>
      )}

      {debt && normal && (
        <Card title="ตารางเปรียบเทียบสถานการณ์โปะ" eyebrow="Scenarios">
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
    </>
  )
}
