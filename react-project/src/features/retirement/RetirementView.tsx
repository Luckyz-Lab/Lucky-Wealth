import type { CSSProperties } from 'react'
import type { AppState, RetirementParams, ViewId } from '../../types'
import type { WealthActions } from '../../hooks/usePersistentWealthState'
import { fmt } from '../../domain/format'
import { calcRetirement } from '../../domain/retirement'
import { Card, MetricCard, RelatedTools } from '../../components/ui'
import { PageHeader } from '../../components/layout'

interface Props {
  state: AppState
  actions: WealthActions
  onNavigate: (view: ViewId) => void
}

const PARAMS: { key: keyof RetirementParams; label: string; min: number; max: number; step?: number; unit: string }[] = [
  { key: 'ca', label: 'อายุปัจจุบัน', min: 18, max: 80, unit: 'ปี' },
  { key: 'ra', label: 'อายุเกษียณ', min: 45, max: 75, unit: 'ปี' },
  { key: 'le', label: 'อายุขัยเป้าหมาย', min: 60, max: 100, unit: 'ปี' },
  { key: 'me', label: 'รายจ่าย/เดือนหลังเกษียณ', min: 5000, max: 100000, step: 1000, unit: 'บาท' },
  { key: 'inf', label: 'เงินเฟ้อ (%/ปี)', min: 0, max: 10, step: 0.1, unit: '%' },
  { key: 'rr', label: 'ผลตอบแทนหลังเกษียณ (%)', min: 0, max: 12, step: 0.1, unit: '%' },
  { key: 'sso', label: 'บำนาญประกันสังคม/เดือน', min: 0, max: 15000, step: 500, unit: 'บาท' },
]

export function RetirementView({ state, actions, onNavigate }: Props) {
  const projection = calcRetirement(state)
  const ok = projection.short === 0
  const params = state.ret
  const realReturn = (params.rr - params.inf) / 100
  let portfolio = projection.ast
  const points = []

  for (let age = params.ca; age <= params.le; age += 2) {
    const t = age - params.ca
    const value = age <= params.ra
      ? projection.ast * Math.pow(1 + projection.wr, t) +
        (projection.wr > 0 ? projection.sav * 12 * ((Math.pow(1 + projection.wr, t) - 1) / projection.wr) : projection.sav * 12 * t)
      : Math.max(0, portfolio * (1 + realReturn) - Math.max(0, projection.infl - (params.sso || 0)) * 12)
    if (age > params.ra) portfolio = value
    points.push({ age, value: Math.max(0, Math.round(value)), accumulation: age <= params.ra })
  }

  const max = Math.max(...points.map((point) => point.value), 1)

  return (
    <>
      <PageHeader
        eyebrow="Retirement simulator"
        title="วางแผนเกษียณ + DCA"
        description="ตั้งเป้ารายได้หลังเกษียณ ดูเงินก้อนที่ต้องมี ช่องว่างพอร์ต และเงินออมที่ควรเติมต่อเดือน"
      />

      <section className="calculator-result">
        <div className="summary-hero">
          <span>{ok ? 'พอร์ตเกินเป้าในสมมติฐานนี้' : 'ยังขาดเงินก้อนวันเกษียณ'}</span>
          <strong>฿{ok ? fmt(projection.proj - projection.nest) : fmt(projection.short)}</strong>
          <small>เป้าหมาย Nest Egg ฿{fmt(projection.nest)} · พอร์ตคาดการณ์ ฿{fmt(projection.proj)}</small>
        </div>
        <div className="metric-grid metric-grid--scenario">
          <MetricCard label="Nest Egg เป้าหมาย" value={`฿${fmt(projection.nest)}`} note="เงินที่ต้องมีวันเกษียณ" />
          <MetricCard label="พอร์ตประมาณ" value={`฿${fmt(projection.proj)}`} tone={ok ? 'good' : 'warn'} note="จากสินทรัพย์และเงินออมปัจจุบัน" />
          <MetricCard label={ok ? 'เกินเป้า' : 'ขาดอยู่'} value={`฿${ok ? fmt(projection.proj - projection.nest) : fmt(projection.short)}`} tone={ok ? 'good' : 'bad'} note={ok ? 'ในสมมติฐานนี้' : 'ช่องว่างที่ต้องเติม'} />
          <MetricCard label="SWR 4%" value={`฿${fmt(projection.swr)}/เดือน`} tone="info" note="ถอนได้โดยประมาณ" />
        </div>
      </section>

      <div className="content-grid content-grid--balanced">
        <Card title="ปรับสมมติฐาน" eyebrow="Assumptions">
          <div className="preset-row">
            {[25000, 30000, 50000, 80000].map((amount) => (
              <button key={amount} type="button" className="chip" onClick={() => actions.updateRetirement('me', amount)}>รายจ่าย ฿{fmt(amount)}</button>
            ))}
            {[55, 60, 65].map((age) => (
              <button key={age} type="button" className="chip" onClick={() => actions.updateRetirement('ra', age)}>เกษียณ {age}</button>
            ))}
          </div>
          <div className="range-stack">
            {PARAMS.map((item) => (
              <label key={item.key} className="range-field">
                <span>
                  <span>{item.label}</span>
                  <strong>{item.unit === 'บาท' ? `฿${fmt(params[item.key])}` : `${params[item.key]} ${item.unit}`}</strong>
                </span>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step || 1}
                  value={params[item.key]}
                  onChange={(event) => actions.updateRetirement(item.key, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
        </Card>

        <Card title="ผลการจำลอง" eyebrow="Projection">
          <div className={`notice ${ok ? 'notice--good' : 'notice--warn'}`}>
            <i aria-hidden="true" className={`ti ${ok ? 'ti-circle-check' : 'ti-alert-circle'}`} />
            <div>
              <strong>{ok ? 'แผนเกษียณผ่านในสมมติฐานนี้' : 'ยังมีช่องว่างที่ต้องเติม'}</strong>
              <p>{ok ? 'รักษาวินัยออมและทบทวนผลตอบแทนทุกปี' : `เพิ่มออมประมาณ ฿${fmt(projection.short / (projection.yrs * 12 || 1))}/เดือน หรือปรับเป้าหมายค่าใช้จ่าย`}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="กราฟพอร์ตตามอายุ" eyebrow="Timeline">
        <div className="retirement-chart" aria-label="กราฟพอร์ตตามอายุ">
          {points.map((point) => (
            <div
              key={point.age}
              className={`retirement-chart__bar ${point.accumulation ? 'is-accumulation' : 'is-drawdown'}`}
              style={{ '--bar-height': `${Math.round((point.value / max) * 100)}%` } as CSSProperties}
              title={`อายุ ${point.age}: ฿${fmt(point.value)}`}
            />
          ))}
        </div>
        <div className="legend">
          <span><i className="legend__dot legend__dot--info" />ช่วงสะสม</span>
          <span><i className="legend__dot legend__dot--good" />ช่วงหลังเกษียณ</span>
        </div>
      </Card>

      <RelatedTools
        onNavigate={onNavigate}
        items={[
          { id: 'tax', title: 'คำนวณภาษี + ค่าลดหย่อน', description: 'ใช้ภาษีที่ต้องจ่ายจริงเพื่อดูเงินเหลือลงทุน', icon: 'ti-receipt-tax' },
          { id: 'loan', title: 'ผ่อนบ้าน / รถ + โปะ', description: 'จำลองว่าควรลดหนี้ก่อนหรือเพิ่ม DCA', icon: 'ti-home-dollar' },
          { id: 'ai', title: 'AI Advisor', description: 'ให้ระบบช่วยอ่านผลจำลองและสรุป action ต่อไป', icon: 'ti-message-2' },
        ]}
      />
    </>
  )
}
