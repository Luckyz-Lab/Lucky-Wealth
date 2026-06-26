import type { AppState, HealthMetric, Totals } from '../types'
import { fmt } from './format'

export function calcTotals(state: AppState): Totals {
  const inc = state.incomes.reduce((sum, item) => sum + item.a, 0)
  const exp = state.expenses.reduce((sum, item) => sum + item.a, 0)
  const ast = state.assets.reduce((sum, item) => sum + item.v, 0)
  const dbt = state.debts.reduce((sum, item) => sum + item.b, 0)
  const liq = state.assets
    .filter((asset) => asset.tp === 'cash' || asset.tp === 'deposit')
    .reduce((sum, item) => sum + item.v, 0)
  const dp = state.debts.reduce((sum, item) => sum + item.p, 0)

  return {
    inc,
    exp,
    ast,
    dbt,
    nw: ast - dbt,
    liq,
    sr: inc > 0 ? ((inc - exp) / inc) * 100 : 0,
    dti: inc > 0 ? (dp / inc) * 100 : 0,
    em: exp > 0 ? liq / exp : 0,
    dp,
  }
}

export function buildHealthMetrics(totals: Totals): HealthMetric[] {
  return [
    {
      id: 'saving-rate',
      label: 'อัตราออม',
      value: `${totals.sr.toFixed(1)}%`,
      tone: totals.sr >= 20 ? 'good' : totals.sr >= 10 ? 'warn' : 'bad',
      note: totals.sr >= 20 ? 'แข็งแรง' : totals.sr >= 10 ? 'พอใช้' : 'ควรเพิ่มเงินออม',
    },
    {
      id: 'dti',
      label: 'DTI Ratio',
      value: `${totals.dti.toFixed(1)}%`,
      tone: totals.dti <= 30 ? 'good' : totals.dti <= 50 ? 'warn' : 'bad',
      note: totals.dti <= 30 ? 'ปลอดภัย' : totals.dti <= 50 ? 'เฝ้าระวัง' : 'สูงเกินไป',
    },
    {
      id: 'emergency',
      label: 'กองทุนฉุกเฉิน',
      value: `${totals.em.toFixed(1)} เดือน`,
      tone: totals.em >= 6 ? 'good' : totals.em >= 3 ? 'warn' : 'bad',
      note: totals.em >= 6 ? 'ครบ 6 เดือน' : `ควรสะสมถึง ${fmt(totals.exp * 6)} บาท`,
    },
  ]
}
